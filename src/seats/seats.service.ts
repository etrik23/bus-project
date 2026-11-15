import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThan, Repository } from 'typeorm';
import { Seat } from './entities/seat.entity.js';
import { HoldSeatsDto } from './dto/hold-seats.dto.js';
import { ReleaseSeatsDto } from './dto/release-seats.dto.js';
import { HOLD_MINUTES, SEAT_STATUS } from './constants/seat.constants.js';
import { Trip } from '../trips/entities/trip.entity.js';
import { TRIP_STATUS } from '../trips/constants/trip.constants.js';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private dataSource: DataSource,
  ) {}

  /** Crea los asientos 1..N de un viaje (se usa dentro de la transacción de TripsService). */
  async createForTrip(manager: EntityManager, tripId: string, total: number) {
    const seats = Array.from({ length: total }, (_, index) =>
      manager.create(Seat, { tripId, seatNumber: index + 1 }),
    );
    await manager.save(Seat, seats);
  }

  /** Mapa de asientos de un viaje (público). */
  async findByTrip(tripId: string) {
    const trip = await this.dataSource.getRepository(Trip).existsBy({ tripId });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    await this.releaseExpiredHolds(tripId);

    return this.seatRepository.find({
      where: { tripId },
      select: {
        seatId: true,
        seatNumber: true,
        seatStatus: true,
        seatReservedUntil: true,
      },
      order: { seatNumber: 'ASC' },
    });
  }

  /** Cantidad de asientos libres por viaje: Map<tripId, libres>. */
  async countAvailableByTrip(tripIds: string[]): Promise<Map<string, number>> {
    if (tripIds.length === 0) return new Map();

    const rows = await this.seatRepository
      .createQueryBuilder('seat')
      .select('seat.tripId', 'tripId')
      .addSelect('COUNT(*)', 'count')
      .where('seat.tripId IN (:...tripIds)', { tripIds })
      .andWhere('seat.seatStatus = :available', { available: SEAT_STATUS.AVAILABLE })
      .groupBy('seat.tripId')
      .getRawMany<{ tripId: string; count: string }>();

    return new Map(rows.map((row) => [row.tripId, Number(row.count)]));
  }

  /**
   * Aparta asientos para un usuario.
   *
   * Evita que dos usuarios tomen el mismo asiento a la vez: dentro de una
   * transacción se bloquean las filas con SELECT ... FOR UPDATE. Si dos
   * peticiones llegan al mismo tiempo, la segunda espera a que termine la
   * primera y entonces ve el asiento ya apartado y recibe un 409.
   */
  async hold(userId: string, holdSeatsDto: HoldSeatsDto) {
    const { tripId, seatIds } = holdSeatsDto;

    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(Trip, { where: { tripId } });
      if (!trip) throw new NotFoundException('Viaje no encontrado');

      const now = new Date();
      if (trip.tripStatus !== TRIP_STATUS.SCHEDULED || trip.tripDepartureAt <= now) {
        throw new BadRequestException('Este viaje ya no está disponible para la venta');
      }

      // Se ordenan por id para bloquear siempre en el mismo orden (evita deadlocks)
      const seats = await manager.find(Seat, {
        where: { seatId: In(seatIds), tripId },
        order: { seatId: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (seats.length !== seatIds.length) {
        throw new NotFoundException('Alguno de los asientos no existe en este viaje');
      }

      for (const seat of seats) {
        const holdExpired =
          seat.seatStatus === SEAT_STATUS.RESERVED &&
          seat.seatReservedUntil !== null &&
          seat.seatReservedUntil <= now;
        const isFree = seat.seatStatus === SEAT_STATUS.AVAILABLE || holdExpired;
        const isMine =
          seat.seatStatus === SEAT_STATUS.RESERVED &&
          seat.reservedById === userId &&
          !holdExpired;

        // Si ya es mío se permite "renovar" el apartado
        if (!isFree && !isMine) {
          throw new ConflictException(
            `El asiento ${seat.seatNumber} ya no está disponible`,
          );
        }
      }

      const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60_000);
      for (const seat of seats) {
        seat.seatStatus = SEAT_STATUS.RESERVED;
        seat.reservedById = userId;
        seat.seatReservedUntil = expiresAt;
      }
      await manager.save(Seat, seats);

      return {
        expiresAt,
        seats: seats
          .sort((a, b) => a.seatNumber - b.seatNumber)
          .map((seat) => ({
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            seatStatus: seat.seatStatus,
          })),
      };
    });
  }

  /** El usuario libera los asientos que él mismo tenía apartados. */
  async release(userId: string, releaseSeatsDto: ReleaseSeatsDto) {
    const result = await this.seatRepository.update(
      {
        seatId: In(releaseSeatsDto.seatIds),
        reservedById: userId,
        seatStatus: SEAT_STATUS.RESERVED,
      },
      {
        seatStatus: SEAT_STATUS.AVAILABLE,
        reservedById: null,
        seatReservedUntil: null,
      },
    );
    return { released: result.affected ?? 0 };
  }

  /** Libera los apartados vencidos (de un viaje o de todos). */
  async releaseExpiredHolds(tripId?: string) {
    await this.seatRepository.update(
      {
        seatStatus: SEAT_STATUS.RESERVED,
        seatReservedUntil: LessThan(new Date()),
        ...(tripId && { tripId }),
      },
      {
        seatStatus: SEAT_STATUS.AVAILABLE,
        reservedById: null,
        seatReservedUntil: null,
      },
    );
  }
}

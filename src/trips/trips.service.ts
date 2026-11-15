import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { QueryTripsDto } from './dto/query-trips.dto.js';
import { Trip } from './entities/trip.entity.js';
import { DEFAULT_TOTAL_SEATS, TRIP_STATUS } from './constants/trip.constants.js';
import { Route } from '../routes/entities/route.entity.js';
import { SeatsService } from '../seats/seats.service.js';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    private seatsService: SeatsService,
    private dataSource: DataSource,
  ) {}

  async create(createTripDto: CreateTripDto) {
    const route = await this.routeRepository.findOneBy({ routeId: createTripDto.routeId });
    if (!route || !route.routeIsActive) {
      throw new NotFoundException('Ruta no encontrada o desactivada');
    }

    const departure = createTripDto.tripDepartureAt;
    if (departure <= new Date()) {
      throw new BadRequestException('La salida debe ser en el futuro');
    }

    const arrival =
      createTripDto.tripArrivalAt ??
      new Date(departure.getTime() + route.routeDurationMinutes * 60_000);
    if (arrival <= departure) {
      throw new BadRequestException('La llegada debe ser posterior a la salida');
    }

    const totalSeats = createTripDto.tripTotalSeats ?? DEFAULT_TOTAL_SEATS;

    // El viaje y todos sus asientos se crean juntos o no se crea nada
    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.save(
        Trip,
        manager.create(Trip, {
          routeId: route.routeId,
          tripDepartureAt: departure,
          tripArrivalAt: arrival,
          tripPrice: createTripDto.tripPrice ?? route.routeBasePrice,
          tripTotalSeats: totalSeats,
        }),
      );
      await this.seatsService.createForTrip(manager, trip.tripId, totalSeats);
      return trip;
    });
  }

  /** Búsqueda pública: solo viajes programados que aún no salen. */
  async findAll(query: QueryTripsDto) {
    // Libera apartados vencidos para que el conteo de asientos sea correcto
    await this.seatsService.releaseExpiredHolds();

    const qb = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.route', 'route')
      .where('trip.tripStatus = :status', { status: TRIP_STATUS.SCHEDULED })
      .andWhere('trip.tripDepartureAt > :now', { now: new Date() });

    if (query.routeId) {
      qb.andWhere('trip.routeId = :routeId', { routeId: query.routeId });
    }
    if (query.date) {
      // La fecha se interpreta en UTC
      qb.andWhere('trip.tripDepartureAt BETWEEN :start AND :end', {
        start: new Date(`${query.date}T00:00:00.000Z`),
        end: new Date(`${query.date}T23:59:59.999Z`),
      });
    }

    const trips = await qb.orderBy('trip.tripDepartureAt', 'ASC').getMany();
    return this.withAvailableSeats(trips);
  }

  /** Todos los viajes, de cualquier estado (personal). */
  findAllForStaff() {
    return this.tripRepository.find({
      relations: { route: true },
      order: { tripDepartureAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    await this.seatsService.releaseExpiredHolds(id);

    const trip = await this.tripRepository.findOne({
      where: { tripId: id },
      relations: { route: true },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const [tripWithSeats] = await this.withAvailableSeats([trip]);
    return tripWithSeats;
  }

  async update(id: string, updateTripDto: UpdateTripDto) {
    const trip = await this.tripRepository.preload({
      tripId: id,
      ...updateTripDto,
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    if (trip.tripArrivalAt <= trip.tripDepartureAt) {
      throw new BadRequestException('La llegada debe ser posterior a la salida');
    }
    return this.tripRepository.save(trip);
  }

  // Cancela el viaje (no se borra): bloquea nuevas reservas y compras
  async remove(id: string) {
    const trip = await this.tripRepository.findOneBy({ tripId: id });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    trip.tripStatus = TRIP_STATUS.CANCELLED;
    await this.tripRepository.save(trip);
    return { message: 'Viaje cancelado' };
  }

  // Agrega availableSeats a cada viaje con una sola consulta agrupada
  private async withAvailableSeats(trips: Trip[]) {
    const available = await this.seatsService.countAvailableByTrip(
      trips.map((trip) => trip.tripId),
    );
    for (const trip of trips) {
      trip.availableSeats = available.get(trip.tripId) ?? 0;
    }
    return trips;
  }
}

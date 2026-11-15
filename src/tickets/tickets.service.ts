import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Ticket } from './entities/ticket.entity.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TICKET_STATUS } from './constants/ticket.constants.js';
import { Seat } from '../seats/entities/seat.entity.js';
import { SEAT_STATUS } from '../seats/constants/seat.constants.js';
import { Trip } from '../trips/entities/trip.entity.js';
import { TRIP_STATUS } from '../trips/constants/trip.constants.js';
import { User } from '../auth/entities/user.entity.js';
import { STAFF_ROLES } from '../auth/constants/roles.constants.js';
import { IDENTITY_STATUS } from '../auth/constants/identity.constants.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * Confirma la compra de asientos que el usuario apartó antes (POST /seats/hold).
   * Todo ocurre en una transacción con los asientos bloqueados, así que no
   * pueden venderse dos veces aunque lleguen peticiones simultáneas.
   * (El pago no está integrado: aquí iría la llamada a la pasarela de pago.)
   */
  async purchase(user: JwtPayload, createTicketDto: CreateTicketDto) {
    await this.assertIdentityIfRequired(user);

    const seatIds = createTicketDto.passengers.map((p) => p.seatId);
    if (new Set(seatIds).size !== seatIds.length) {
      throw new BadRequestException('Hay asientos repetidos en la compra');
    }
    const passengerBySeat = new Map<string, string>(
      createTicketDto.passengers.map((p) => [p.seatId, p.passengerName] as [string, string]),
    );

    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(Trip, {
        where: { tripId: createTicketDto.tripId },
      });
      if (!trip) throw new NotFoundException('Viaje no encontrado');

      const now = new Date();
      if (trip.tripStatus !== TRIP_STATUS.SCHEDULED || trip.tripDepartureAt <= now) {
        throw new BadRequestException('Este viaje ya no está disponible para la venta');
      }

      const seats = await manager.find(Seat, {
        where: { seatId: In(seatIds), tripId: trip.tripId },
        order: { seatId: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (seats.length !== seatIds.length) {
        throw new NotFoundException('Alguno de los asientos no existe en este viaje');
      }

      // Cada asiento debe seguir apartado por este usuario y sin vencer
      for (const seat of seats) {
        const holdIsMine =
          seat.seatStatus === SEAT_STATUS.RESERVED &&
          seat.reservedById === user.sub &&
          seat.seatReservedUntil !== null &&
          seat.seatReservedUntil > now;

        if (!holdIsMine) {
          throw new ConflictException(
            `La reserva del asiento ${seat.seatNumber} expiró o no te pertenece`,
          );
        }
      }

      const tickets = seats.map((seat) =>
        manager.create(Ticket, {
          ticketCode: this.generateCode(),
          ticketPassengerName: passengerBySeat.get(seat.seatId)!,
          ticketPrice: trip.tripPrice,
          userId: user.sub,
          tripId: trip.tripId,
          seatId: seat.seatId,
        }),
      );

      for (const seat of seats) {
        seat.seatStatus = SEAT_STATUS.SOLD;
        seat.reservedById = null;
        seat.seatReservedUntil = null;
      }
      await manager.save(Seat, seats);

      return manager.save(Ticket, tickets);
    });
  }

  /** Boletos del usuario autenticado. */
  findMine(userId: string) {
    return this.ticketRepository.find({
      where: { userId },
      relations: { trip: { route: true }, seat: true },
      order: { ticketPurchasedAt: 'DESC' },
    });
  }

  /** Todos los boletos (personal). */
  findAll() {
    return this.ticketRepository.find({
      relations: { trip: { route: true }, seat: true, user: true },
      order: { ticketPurchasedAt: 'DESC' },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketId: id },
      relations: { trip: { route: true }, seat: true, user: true },
    });
    if (!ticket) throw new NotFoundException('Boleto no encontrado');

    this.assertCanAccess(ticket.userId, user);
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketRepository.preload({
      ticketId: id,
      ...updateTicketDto,
    });
    if (!ticket) throw new NotFoundException('Boleto no encontrado');
    return this.ticketRepository.save(ticket);
  }

  /** Cancela el boleto y libera el asiento (solo si el viaje aún no sale). */
  async cancel(id: string, user: JwtPayload) {
    return this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(Ticket, {
        where: { ticketId: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!ticket) throw new NotFoundException('Boleto no encontrado');

      this.assertCanAccess(ticket.userId, user);

      if (ticket.ticketStatus === TICKET_STATUS.CANCELLED) {
        throw new ConflictException('El boleto ya fue cancelado');
      }

      const trip = await manager.findOne(Trip, { where: { tripId: ticket.tripId } });
      if (trip && trip.tripDepartureAt <= new Date()) {
        throw new BadRequestException(
          'No puedes cancelar un boleto de un viaje que ya salió',
        );
      }

      await manager.update(
        Seat,
        { seatId: ticket.seatId },
        {
          seatStatus: SEAT_STATUS.AVAILABLE,
          reservedById: null,
          seatReservedUntil: null,
        },
      );

      ticket.ticketStatus = TICKET_STATUS.CANCELLED;
      return manager.save(Ticket, ticket);
    });
  }

  // ---------- Helpers ----------
  private isStaff(user: JwtPayload) {
    return user.userRoles.some((role) => STAFF_ROLES.includes(role));
  }

  // El dueño del boleto o el personal pueden verlo / cancelarlo
  private assertCanAccess(ownerId: string, user: JwtPayload) {
    if (this.isStaff(user) || ownerId === user.sub) return;
    throw new ForbiddenException('Este boleto no te pertenece');
  }

  // Bonus: si require_identity=true, los clientes deben tener identidad verificada
  private async assertIdentityIfRequired(user: JwtPayload) {
    if (this.configService.get<string>('require_identity') !== 'true') return;
    if (this.isStaff(user)) return;

    const account = await this.dataSource
      .getRepository(User)
      .findOneBy({ userId: user.sub });
    if (account?.userIdentityStatus !== IDENTITY_STATUS.VERIFIED) {
      throw new ForbiddenException(
        'Debes verificar tu identidad antes de comprar boletos',
      );
    }
  }

  private generateCode() {
    return `BUS-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

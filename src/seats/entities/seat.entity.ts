import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity.js';
import { User } from '../../auth/entities/user.entity.js';
import { SEAT_STATUS } from '../constants/seat.constants.js';

@Entity()
@Unique(['tripId', 'seatNumber'])
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  seatId: string;

  @Column('int')
  seatNumber: number;

  @Column({ type: 'enum', enum: SEAT_STATUS, default: SEAT_STATUS.AVAILABLE })
  seatStatus: SEAT_STATUS;

  // Hasta cuándo es válido el apartado (null si no está apartado)
  @Column({ type: 'timestamptz', nullable: true })
  seatReservedUntil: Date | null;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.seats, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Relation<Trip>;

  // Usuario que tiene apartado el asiento
  @Column({ type: 'uuid', nullable: true })
  reservedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservedById' })
  reservedBy: Relation<User> | null;
}

import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import { Trip } from '../../trips/entities/trip.entity.js';
import { Seat } from '../../seats/entities/seat.entity.js';
import { TICKET_STATUS } from '../constants/ticket.constants.js';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  // Código corto para mostrar / validar en la abordada
  @Column('text', { unique: true })
  ticketCode: string;

  @Column('text')
  ticketPassengerName: string;

  // Precio al momento de la compra (el precio del viaje puede cambiar después)
  @Column('float')
  ticketPrice: number;

  @Column({ type: 'enum', enum: TICKET_STATUS, default: TICKET_STATUS.ACTIVE })
  ticketStatus: TICKET_STATUS;

  @CreateDateColumn()
  ticketPurchasedAt: Date;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tripId' })
  trip: Relation<Trip>;

  // Un asiento puede tener varios tickets a lo largo del tiempo (si uno se cancela),
  // por eso no es OneToOne: solo uno puede estar ACTIVE a la vez.
  @Column('uuid')
  seatId: string;

  @ManyToOne(() => Seat, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seatId' })
  seat: Relation<Seat>;
}

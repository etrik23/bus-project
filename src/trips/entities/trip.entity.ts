import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Route } from '../../routes/entities/route.entity.js';
import { Seat } from '../../seats/entities/seat.entity.js';
import { TRIP_STATUS } from '../constants/trip.constants.js';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  tripId: string;

  @Column('uuid')
  routeId: string;

  @ManyToOne(() => Route, (route) => route.trips, { nullable: false })
  @JoinColumn({ name: 'routeId' })
  route: Relation<Route>;

  @Column({ type: 'timestamptz' })
  tripDepartureAt: Date;

  @Column({ type: 'timestamptz' })
  tripArrivalAt: Date;

  @Column('float')
  tripPrice: number;

  @Column('int')
  tripTotalSeats: number;

  @Column({ type: 'enum', enum: TRIP_STATUS, default: TRIP_STATUS.SCHEDULED })
  tripStatus: TRIP_STATUS;

  @OneToMany(() => Seat, (seat) => seat.trip)
  seats: Relation<Seat[]>;

  // No es columna: se llena con loadRelationCountAndMap en las consultas
  availableSeats?: number;
}

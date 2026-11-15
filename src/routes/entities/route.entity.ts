import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity.js';

@Entity()
@Unique(['routeOrigin', 'routeDestination'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  routeId: string;

  @Column('text')
  routeOrigin: string;

  @Column('text')
  routeDestination: string;

  @Column('float')
  routeDistanceKm: number;

  @Column('int')
  routeDurationMinutes: number;

  // Precio sugerido: cada viaje puede definir su propio precio
  @Column('float')
  routeBasePrice: number;

  // Las rutas no se borran, se desactivan (conservan su historial de viajes)
  @Column('boolean', { default: true })
  routeIsActive: boolean;

  @OneToMany(() => Trip, (trip) => trip.route)
  trips: Relation<Trip[]>;
}

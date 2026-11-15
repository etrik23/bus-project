import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service.js';
import { TripsController } from './trips.controller.js';
import { Trip } from './entities/trip.entity.js';
import { Route } from '../routes/entities/route.entity.js';
import { SeatsModule } from '../seats/seats.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Route]), SeatsModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}

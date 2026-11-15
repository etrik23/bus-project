import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatsService } from './seats.service.js';
import { SeatsController } from './seats.controller.js';
import { Seat } from './entities/seat.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Seat])],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}

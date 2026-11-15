import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesService } from './routes.service.js';
import { RoutesController } from './routes.controller.js';
import { Route } from './entities/route.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Route])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}

import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeatsService } from './seats.service.js';
import { HoldSeatsDto } from './dto/hold-seats.dto.js';
import { ReleaseSeatsDto } from './dto/release-seats.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { UserData } from '../auth/decorators/user.decorator.js';
import { BUYER_ROLES } from '../auth/constants/roles.constants.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiAuth()
@ApiTags('Seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  // Público: mapa de asientos con su estado
  @Get('trip/:tripId')
  findByTrip(@Param('tripId', new ParseUUIDPipe({ version: '4' })) tripId: string) {
    return this.seatsService.findByTrip(tripId);
  }

  // Aparta los asientos para el usuario autenticado durante unos minutos
  @Auth(...BUYER_ROLES)
  @Post('hold')
  hold(@UserData() user: JwtPayload, @Body() holdSeatsDto: HoldSeatsDto) {
    return this.seatsService.hold(user.sub, holdSeatsDto);
  }

  // Libera asientos apartados por el propio usuario
  @Auth(...BUYER_ROLES)
  @Post('release')
  release(@UserData() user: JwtPayload, @Body() releaseSeatsDto: ReleaseSeatsDto) {
    return this.seatsService.release(user.sub, releaseSeatsDto);
  }
}

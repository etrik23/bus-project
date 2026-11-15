import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TripsService } from './trips.service.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { QueryTripsDto } from './dto/query-trips.dto.js';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { ApiAuth } from '../auth/decorators/api.decorator.js';
import { OPERATOR_ROLES, ROLES } from '../auth/constants/roles.constants.js';

@ApiAuth()
@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Auth(ROLES.MANAGER)
  @Post()
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }

  // Público: búsqueda de viajes disponibles (?routeId=...&date=YYYY-MM-DD)
  @Get()
  findAll(@Query() query: QueryTripsDto) {
    return this.tripsService.findAll(query);
  }

  // Debe ir antes de ':id'
  @Auth(...OPERATOR_ROLES)
  @Get('all')
  findAllForStaff() {
    return this.tripsService.findAllForStaff();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tripsService.findOne(id);
  }

  @Auth(ROLES.MANAGER)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, updateTripDto);
  }

  // Cancela el viaje
  @Auth(ROLES.MANAGER)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tripsService.remove(id);
  }
}

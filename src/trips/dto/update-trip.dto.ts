import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTripDto } from './create-trip.dto.js';
import { TRIP_STATUS } from '../constants/trip.constants.js';

// La ruta y el número de asientos no cambian una vez creado el viaje
export class UpdateTripDto extends PartialType(
  OmitType(CreateTripDto, ['routeId', 'tripTotalSeats'] as const),
) {
  @ApiPropertyOptional({ enum: TRIP_STATUS })
  @IsOptional()
  @IsEnum(TRIP_STATUS)
  tripStatus?: TRIP_STATUS;
}

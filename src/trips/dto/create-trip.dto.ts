import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator';
import { DEFAULT_TOTAL_SEATS } from '../constants/trip.constants.js';

export class CreateTripDto {
  @ApiProperty()
  @IsUUID()
  routeId: string;

  @ApiProperty({ example: '2026-12-20T08:00:00-06:00' })
  @Type(() => Date)
  @IsDate()
  tripDepartureAt: Date;

  @ApiPropertyOptional({
    description: 'Si se omite se calcula con la duración de la ruta',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  tripArrivalAt?: Date;

  @ApiPropertyOptional({ description: 'Si se omite se usa el precio base de la ruta' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  tripPrice?: number;

  @ApiPropertyOptional({ default: DEFAULT_TOTAL_SEATS })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  tripTotalSeats?: number;
}

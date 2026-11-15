import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

export class QueryTripsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ example: '2026-12-20', description: 'Fecha de salida (YYYY-MM-DD, UTC)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener el formato YYYY-MM-DD' })
  date?: string;
}

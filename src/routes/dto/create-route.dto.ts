import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'Oaxaca' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  routeOrigin: string;

  @ApiProperty({ example: 'Puebla' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  routeDestination: string;

  @ApiProperty({ example: 340 })
  @IsNumber()
  @IsPositive()
  routeDistanceKm: number;

  @ApiProperty({ example: 300, description: 'Duración aproximada en minutos' })
  @IsInt()
  @IsPositive()
  routeDurationMinutes: number;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @IsPositive()
  routeBasePrice: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  routeIsActive?: boolean;
}

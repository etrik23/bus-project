import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { MAX_SEATS_PER_ORDER } from '../constants/seat.constants.js';

export class HoldSeatsDto {
  @ApiProperty()
  @IsUUID()
  tripId: string;

  @ApiProperty({ type: [String], description: 'IDs de los asientos a apartar' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SEATS_PER_ORDER)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  seatIds: string[];
}

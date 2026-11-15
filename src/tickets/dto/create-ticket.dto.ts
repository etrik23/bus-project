import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_SEATS_PER_ORDER } from '../../seats/constants/seat.constants.js';

export class TicketPassengerDto {
  @ApiProperty({ description: 'Asiento previamente apartado con POST /seats/hold' })
  @IsUUID()
  seatId: string;

  @ApiProperty({ example: 'María López' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  passengerName: string;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsUUID()
  tripId: string;

  @ApiProperty({ type: [TicketPassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SEATS_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => TicketPassengerDto)
  passengers: TicketPassengerDto[];
}

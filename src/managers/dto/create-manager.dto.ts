import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsPositive, IsString, Matches, MaxLength } from 'class-validator';

export class CreateManagerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  managerFullName: string;

  @ApiProperty()
  @IsEmail()
  managerEmail: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  managerSalary: number;

  @ApiProperty({ example: '6141234567' })
  @IsString()
  @Matches(/^\d{10}$/, { message: 'managerPhoneNumber debe tener 10 dígitos' })
  managerPhoneNumber: string;
}

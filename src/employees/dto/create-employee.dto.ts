import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  employeeName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(70)
  employeeLastName: string;

  @ApiProperty({ example: '6141234567' })
  @IsString()
  @Matches(/^\d{10}$/, { message: 'employeePhoneNumber debe tener 10 dígitos' })
  employeePhoneNumber: string;

  @ApiProperty()
  @IsEmail()
  employeeEmail: string;

  @ApiPropertyOptional({ description: 'Manager al que reporta' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

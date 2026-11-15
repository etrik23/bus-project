import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// Los roles NO vienen en el body: los asigna el servidor según el endpoint.
export class CreateUserDto {
  @ApiProperty({ default: 'user@gmail.com' })
  @IsEmail()
  userEmail: string;

  @ApiProperty({ default: '23112008' })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // límite de bcrypt
  userPassword: string;

  @ApiProperty({ default: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userFullName: string;
}

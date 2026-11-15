import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

// El correo no se puede cambiar desde el perfil
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['userEmail'] as const),
) {}

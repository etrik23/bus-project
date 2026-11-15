import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IDENTITY_STATUS } from '../constants/identity.constants.js';

export class VerifyIdentityDto {
  @ApiProperty({ enum: [IDENTITY_STATUS.VERIFIED, IDENTITY_STATUS.REJECTED] })
  @IsIn([IDENTITY_STATUS.VERIFIED, IDENTITY_STATUS.REJECTED])
  userIdentityStatus: IDENTITY_STATUS;
}

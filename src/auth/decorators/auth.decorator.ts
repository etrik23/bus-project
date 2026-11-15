import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { ROLES } from '../constants/roles.constants.js';

/**
 * Protege un endpoint (o un controlador completo).
 * El rol Admin siempre tiene acceso. Sin argumentos = solo Admin.
 */
export const Auth = (...roles: ROLES[]) => {
  return applyDecorators(
    Roles([...roles, ROLES.ADMIN]),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
  );
};

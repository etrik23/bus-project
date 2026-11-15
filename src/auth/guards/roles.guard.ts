import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator.js';
import type { JwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Reflector === metadata (se revisa el método y, si no, el controlador)
    const roles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const user: JwtPayload | undefined = context.switchToHttp().getRequest().user;
    if (!user) return false;

    return this.matchRoles(roles, user.userRoles);
  }

  matchRoles(roles: string[], userRoles: string[]) {
    return userRoles.some((userRole) => roles.includes(userRole));
  }
}

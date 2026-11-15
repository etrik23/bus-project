import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Regresa el payload del JWT (JwtPayload) del usuario autenticado. */
export const UserData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

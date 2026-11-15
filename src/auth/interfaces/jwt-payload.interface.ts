export interface JwtPayload {
  /** userId del usuario */
  sub: string;
  userEmail: string;
  userRoles: string[];
}

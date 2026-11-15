export enum ROLES {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  EMPLOYEE = 'Employee',
  CUSTOMER = 'Customer',
}

/** Roles que pertenecen al personal de la empresa. */
export const STAFF_ROLES: string[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE];

/** Personal operativo (Admin se agrega automáticamente en @Auth). */
export const OPERATOR_ROLES: ROLES[] = [ROLES.EMPLOYEE, ROLES.MANAGER];

/** Quienes pueden apartar asientos y comprar boletos. */
export const BUYER_ROLES: ROLES[] = [ROLES.CUSTOMER, ROLES.EMPLOYEE, ROLES.MANAGER];

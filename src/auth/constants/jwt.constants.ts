// Igual que en ocso. Si defines `jwt_key` en el .env se usa ese valor en su lugar.
export const JWT_KEY = 'qwerty';
export const EXPIRES_IN = '1d';
export const TOKEN_NAME = 'auth_for_bus';
export const TOKEN_MAX_AGE = 1000 * 60 * 60 * 24; // 1 día, igual que EXPIRES_IN

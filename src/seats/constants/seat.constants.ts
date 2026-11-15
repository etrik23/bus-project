export enum SEAT_STATUS {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED', // apartado temporalmente por un usuario
  SOLD = 'SOLD',
}

/** Minutos que un asiento queda apartado mientras el usuario completa su compra. */
export const HOLD_MINUTES = 5;

/** Máximo de asientos por apartado / compra. */
export const MAX_SEATS_PER_ORDER = 5;

export enum IDENTITY_STATUS {
  NONE = 'NONE',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export const IDENTITY_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const IDENTITY_FILE_TYPES = /^(image\/jpeg|image\/png|application\/pdf)$/;

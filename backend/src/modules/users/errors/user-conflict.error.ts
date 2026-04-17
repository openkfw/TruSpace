import { ConflictError } from '../../../shared/errors';

export class UserConflictError extends ConflictError {
  constructor(email: string, details?: unknown) {
    super(`Could not create user. "${email}" already exists.`, details);
  }
}

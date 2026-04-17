import { NotFoundError } from '../../../shared/errors';

export class UserNotFoundError extends NotFoundError {
  constructor(userId?: string, details?: unknown) {
    super(`User not found ${userId ? `(${userId})` : ''}`, details);
  }
}

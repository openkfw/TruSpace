import { NotFoundError } from '../../../shared/errors';

export class AvatarNotFoundError extends NotFoundError {
  constructor(details?: unknown) {
    super(`Avatar not found`, details);
  }
}

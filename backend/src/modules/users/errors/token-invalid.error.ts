import { HttpError } from '../../../shared/errors';

export class TokenInvalidError extends HttpError {
  constructor(details?: unknown) {
    super(400, 'TOKEN_INVALID', 'Invalid token', details);
  }
}

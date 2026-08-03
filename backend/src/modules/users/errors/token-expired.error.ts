import { HttpError } from '../../../shared/errors';

export class TokenExpiredError extends HttpError {
  constructor(details?: unknown) {
    super(400, 'TOKEN_EXPIRED', 'Expired token', details);
  }
}

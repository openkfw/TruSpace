import { HttpError } from './http.error';

export class InternalServerError extends HttpError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details);
  }
}

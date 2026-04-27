import { HttpError } from './http.error';

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

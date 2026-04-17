import { HttpError } from './http.error';

export class NotFoundError extends HttpError {
  constructor(message = 'Not found', details?: unknown) {
    super(404, 'NOT_FOUND', message, details);
  }
}

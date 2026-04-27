import { HttpError } from './http.error';

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

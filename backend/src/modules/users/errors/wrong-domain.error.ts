import { HttpError } from '../../../shared/errors';

export class WrongDomainError extends HttpError {
  constructor(email: string, details?: unknown) {
    super(400, 'WRONG_DOMAIN', `Email domain not allowed for "${email}".`, details);
  }
}

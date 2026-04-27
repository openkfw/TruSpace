import { NotFoundError } from '../../../shared/errors';

export class FileNotFoundError extends NotFoundError {
  constructor(id: string, details?: unknown) {
    super(`File not found (${id})`, details);
  }
}

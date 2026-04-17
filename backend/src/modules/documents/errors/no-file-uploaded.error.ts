import { BadRequestError } from '../../../shared/errors';

export class NoFileUploadedError extends BadRequestError {
  constructor(details?: unknown) {
    super(`No document uploaded `, details);
  }
}

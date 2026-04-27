import { InternalServerError } from '../../../shared/errors';

export class FileUploadFailedError extends InternalServerError {
  constructor(details?: unknown) {
    super(`Internal Server Error: File upload failed`, details);
  }
}

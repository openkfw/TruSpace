import { ConflictError } from '../../../shared/errors';

export class PromptConflictError extends ConflictError {
  constructor(title?: string, details?: unknown) {
    super(`Prompt already exists ${title ? `(${title})` : ''}`, details);
  }
}

import { NotFoundError } from '../../../shared/errors';

export class PromptNotFoundError extends NotFoundError {
  constructor(title: string, details?: unknown) {
    super(`Prompt not found (${title})`, details);
  }
}

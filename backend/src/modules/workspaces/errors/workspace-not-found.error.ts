import { NotFoundError } from '../../../shared/errors';

export class WorkspaceNotFoundError extends NotFoundError {
  constructor(wUID: string, details?: unknown) {
    super(`Workspace not found (UID: ${wUID})`, details);
  }
}

import { ConflictError } from '../../../shared/errors';

export class WorkspaceConflictError extends ConflictError {
  constructor(name: string, details?: unknown) {
    super(`Could not create workspace. "${name}" already exists.`, details);
  }
}

import logger from '../../../shared/config/winston';
import { InternalServerError } from '../../../shared/errors';
import { findUsersInWorkspace } from '../../../shared/handlers/userPermissions';

export async function getUsersInWorkspaceByWorkspaceId(workspaceId: string) {
  try {
    const results = await findUsersInWorkspace(workspaceId);
    return results;
  } catch (error) {
    logger.error('Getting permissions error:', error);
    throw new InternalServerError('Getting workspace permissions failed', error);
  }
}

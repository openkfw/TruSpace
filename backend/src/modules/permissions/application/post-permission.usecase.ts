import logger from '../../../shared/config/winston';
import { BadRequestError, HttpError, InternalServerError } from '../../../shared/errors';
import { createPermission, UserPermissionDto } from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';
import { workspacesIpfsRepository } from '../../workspaces/infrastructure/workspaces-ipfs.repository';

export async function postPermission(email: string, workspaceId: string) {
  try {
    const workspaces = await workspacesIpfsRepository.getWorkspaceById(workspaceId);

    if (!workspaces.length) {
      throw new BadRequestError('Adding user to workspace failed, workspace does not exist');
    }

    if (workspaces[0].meta.is_public) {
      throw new BadRequestError('Adding user to workspace failed, workspace is public');
    }

    const permission: UserPermissionDto = {
      workspaceId,
      email,
      role: 'admin',
    };

    await createPermission(permission);
    sendNotification(email, 'addedToWorkspace', `/workspace/${workspaceId}`, workspaces[0].meta.name);

    return {
      status: 'success',
      message: 'User added to the workspace',
    };
  } catch (error) {
    logger.error('Adding permission error:', error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new InternalServerError('Adding user to workspace failed', error);
  }
}

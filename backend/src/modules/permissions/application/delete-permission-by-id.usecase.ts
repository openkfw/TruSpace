import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { findPermissionById, removePermission } from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function deletePermissionById(permissionId: string): Promise<UseCaseResponse> {
  try {
    const permission = await findPermissionById(permissionId);

    if (!permission) {
      return {
        statusCode: 404,
        body: {
          status: 'failure',
          message: 'Permission not found',
        },
      };
    }

    await removePermission(permissionId);

    const client = new IpfsClient();
    const workspaces = await client.getWorkspaceById(permission.workspaceId);

    sendNotification(permission.email, 'removedFromWorkspace', '/', workspaces[0].meta.name);

    return { body: null };
  } catch (error) {
    logger.error('Removing permissions error:', error);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Removing workspace permissions failed',
      },
    };
  }
}

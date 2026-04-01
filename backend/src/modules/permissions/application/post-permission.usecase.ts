import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { createPermission, UserPermissionDto } from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function postPermission(email: string, workspaceId: string): Promise<UseCaseResponse> {
  try {
    const client = new IpfsClient();
    const workspaces = await client.getWorkspaceById(workspaceId);

    if (!workspaces.length) {
      return {
        statusCode: 400,
        body: {
          status: 'failure',
          message: 'Adding user to workspace failed, workspace does not exist',
        },
      };
    }

    if (workspaces[0].meta.is_public) {
      return {
        statusCode: 400,
        body: {
          status: 'failure',
          message: 'Adding user to workspace failed, workspace is public',
        },
      };
    }

    const permission: UserPermissionDto = {
      workspaceId,
      email,
      role: 'admin',
    };

    await createPermission(permission);
    sendNotification(email, 'addedToWorkspace', `/workspace/${workspaceId}`, workspaces[0].meta.name);

    return {
      body: {
        status: 'success',
        message: 'User added to the workspace',
      },
    };
  } catch (error) {
    logger.error('Adding permission error:', error);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Adding user to workspace failed',
      },
    };
  }
}

import axios from 'axios';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import {
  createPermission,
  findUsersInWorkspace,
  removePermissionsForWorkspace,
} from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';
import { UseCaseResponse } from '../../../shared/types/usecase';
import { getUserSettings } from '../../../shared/utility/user';

export async function updateWorkspaceType(
  wUID: string,
  isPublic: boolean,
  currentUserEmail: string,
): Promise<UseCaseResponse> {
  const client = new IpfsClient();

  try {
    await client.updateWorkspaceType(wUID, isPublic);

    if (isPublic === false) {
      const currentPermissions = await findUsersInWorkspace(wUID);
      const currentUserPermissions = currentPermissions.find((permission) => permission.email === currentUserEmail);

      if (!currentUserPermissions) {
        await createPermission({
          workspaceId: wUID,
          email: currentUserEmail,
          role: 'owner',
        });
      }
    } else {
      const usersInWorkspace = await findUsersInWorkspace(wUID);
      const workspaceDetails = await client.getWorkspaceById(wUID);

      usersInWorkspace.forEach(async (user) => {
        const { email } = user;
        const userSettings = await getUserSettings(email);

        if (userSettings?.notificationSettings?.workspaceChange && email !== currentUserEmail) {
          sendNotification(email, 'workspaceChange', `/workspace/${wUID}`, `${workspaceDetails[0].meta.name}`);
        }
      });

      await removePermissionsForWorkspace(wUID);
    }

    return {
      body: {
        message: 'Workspace updated successfully',
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      logger.error(error);
      return {
        statusCode: 404,
        body: {
          message: 'Workspace not found',
        },
      };
    }

    logger.error(error);
    return {
      statusCode: 500,
      body: {
        message: 'Internal Server Error',
      },
    };
  }
}

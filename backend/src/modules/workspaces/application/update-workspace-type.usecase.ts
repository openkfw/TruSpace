import axios from 'axios';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import {
  createPermission,
  findUsersInWorkspace,
  removePermissionsForWorkspace,
} from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';
import { getUserSettings } from '../../../shared/utility/user';
import { WorkspaceNotFoundError } from '../errors/workspace-not-found.error';
import { InternalServerError } from '../../../shared/errors';

export async function updateWorkspaceType(wUID: string, isPublic: boolean, currentUserEmail: string) {
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

    return 'Workspace updated successfully';
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new WorkspaceNotFoundError(wUID, error);
    }
    throw new InternalServerError(`Failed to update workspace (${wUID})`, error);
  }
}

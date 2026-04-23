import logger from '../../../shared/config/winston';
import { InternalServerError } from '../../../shared/errors';
import {
  createPermission,
  findPermissionsByEmail,
  findUsersInWorkspace,
  removePermission,
  selectNextOldestPermissionUser,
} from '../../../shared/handlers/userPermissions';
import { deleteWorkspaceById } from '../../workspaces/application/delete-workspace-by-id.usecase';
import { workspacesIpfsRepository } from '../../workspaces/infrastructure/workspaces-ipfs.repository';

export async function deletePermissionsRemoveAllByEmail(email: string) {
  try {
    const permissions = await findPermissionsByEmail(email);

    // We delete all found permissions
    // Additionally: for each permission found, check the workspace if there are other users and if it is private.
    // If there are no other users, delete the workspace and all its data (files, folders, etc.)
    // If there are other users and the deleted user is an owner, assign the owner role to the next oldest user

    for (const permission of permissions) {
      if (!permission.id || !permission.workspaceId) {
        continue;
      }
      await removePermission(permission.id);

      const workspace = await workspacesIpfsRepository.getWorkspaceById(permission.workspaceId);
      const users = await findUsersInWorkspace(permission.workspaceId);

      if (workspace.length > 0 && !workspace[0].meta.is_public) {
        if (users.length === 0) {
          const wCID = workspace[0].cid;
          await deleteWorkspaceById(wCID, permission.workspaceId);
        } else if (permission.role === 'owner') {
          const nextOwner = selectNextOldestPermissionUser(users);

          if (nextOwner?.id && nextOwner.email) {
            await removePermission(nextOwner.id);
            await createPermission({
              workspaceId: permission.workspaceId,
              email: nextOwner.email,
              role: 'owner',
              created_at: nextOwner.created_at,
            });
          }
        }
      }
    }

    return {
      status: 'success',
      message: 'User permissions removed successfully',
    };
  } catch (error) {
    logger.error('Removing user permissions failed:', error);
    throw new InternalServerError('Removing user failed', error);
  }
}

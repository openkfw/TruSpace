import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { NotFoundError } from '../../../shared/errors';
import { findPermissionById, removePermission } from '../../../shared/handlers/userPermissions';
import { sendNotification } from '../../../shared/mailing/notifications';

export async function deletePermissionById(permissionId: string) {
  const permission = await findPermissionById(permissionId);

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  await removePermission(permissionId);

  const client = new IpfsClient();
  const workspaces = await client.getWorkspaceById(permission.workspaceId);

  sendNotification(permission.email, 'removedFromWorkspace', '/', workspaces[0].meta.name);

  return null;
}

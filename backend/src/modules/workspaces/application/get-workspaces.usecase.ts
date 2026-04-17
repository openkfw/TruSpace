import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';

export async function getWorkspaces(email: string) {
  const allWorkspaces = await new IpfsClient().getAllWorkspaces();
  const allowedWs = (await findPermissionsByEmail(email)).map((permission) => permission.workspaceId);

  return allWorkspaces.filter((workspace) => allowedWs.includes(workspace.uuid) || workspace.meta.is_public);
}

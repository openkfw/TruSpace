import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';
import { workspacesIpfsRepository } from '../infrastructure/workspaces-ipfs.repository';

export async function getWorkspaces(email: string) {
  const allWorkspaces = await workspacesIpfsRepository.getAllWorkspaces();
  const allowedWs = (await findPermissionsByEmail(email)).map((permission) => permission.workspaceId);

  return allWorkspaces.filter((workspace) => allowedWs.includes(workspace.uuid) || workspace.meta.is_public);
}

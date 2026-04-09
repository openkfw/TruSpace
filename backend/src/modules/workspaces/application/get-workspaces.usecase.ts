import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function getWorkspaces(email: string): Promise<UseCaseResponse> {
  const allWorkspaces = await new IpfsClient().getAllWorkspaces();
  const allowedWs = (await findPermissionsByEmail(email)).map((permission) => permission.workspaceId);

  return {
    body: allWorkspaces.filter((workspace) => allowedWs.includes(workspace.uuid) || workspace.meta.is_public),
  };
}

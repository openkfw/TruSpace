import { Response } from "express";
import { findPermissionsByEmail } from "../handlers/userPermissions";
import { workspacesIpfsRepository } from '../../modules/workspaces/infrastructure/workspaces-ipfs.repository';

export const checkPermissionForWorkspace = async (
  email: string,
  res: Response,
  workspaceId: string,
  publicWorkspaces?: { uuid?: string; meta?: { workspace_uuid?: string } }[],
) => {
  const [allowedWs, resolvedPublicWorkspaces] = await Promise.all([
    findPermissionsByEmail(email).then((p) => p.map((p) => p.workspaceId)),
    publicWorkspaces
      ? Promise.resolve(publicWorkspaces)
      : workspacesIpfsRepository.getPublicWorkspaces(),
  ]);

  const publicWsIds = resolvedPublicWorkspaces.map(
    (ws) => ws.uuid ?? ws.meta?.workspace_uuid,
  );

  if (!allowedWs.includes(workspaceId) && !publicWsIds.includes(workspaceId)) {
    res.status(401);
  }
};
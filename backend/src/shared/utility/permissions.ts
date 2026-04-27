import { Response } from "express";
import { findPermissionsByEmail } from "../handlers/userPermissions";
import { workspacesIpfsRepository } from "../../modules/workspaces/infrastructure/workspaces-ipfs.repository";

export const checkPermissionForWorkspace = async (
  email: string,
  res: Response,
  workspaceId: string,
) => {
  const allowedWs = (await findPermissionsByEmail(email)).map(
    (p) => p.workspaceId,
  );

  const publicWorkspaces = await workspacesIpfsRepository.getPublicWorkspaces();
  const publicWsIds = publicWorkspaces.map((ws) => ws.uuid);

  if (!allowedWs.includes(workspaceId) && !publicWsIds.includes(workspaceId)) {
    res.status(401);
  }
};

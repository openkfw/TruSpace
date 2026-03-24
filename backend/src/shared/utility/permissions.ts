import { Response } from "express";
import { IpfsClient } from "../clients/ipfs-client";
import { findPermissionsByEmail } from "../handlers/userPermissions";

export const checkPermissionForWorkspace = async (
  email: string,
  res: Response,
  workspaceId: string,
) => {
  const client = new IpfsClient();
  const allowedWs = (await findPermissionsByEmail(email)).map(
    (p) => p.workspaceId,
  );

  const publicWorkspaces = await client.getPublicWorkspaces();
  const publicWsIds = publicWorkspaces.map((ws) => ws.uuid);

  if (!allowedWs.includes(workspaceId) && !publicWsIds.includes(workspaceId)) {
    res.status(401);
  }
};

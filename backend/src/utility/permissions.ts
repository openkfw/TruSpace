import { Response } from "express";
import { findPermissionsByEmailDb } from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { AuthenticatedRequest } from "../types";

export const checkPermissionForWorkspace = async (
  req: AuthenticatedRequest,
  res: Response,
  workspaceId: string
) => {
  const client = new IpfsClient();
  const allowedWs = (
    await findPermissionsByEmailDb(req.user?.email as string)
  ).map((p) => p.workspace_id);

  const publicWorkspaces = await client.getPublicWorkspaces();
  const publicWsIds = publicWorkspaces.map((ws) => ws.uuid);

  if (!allowedWs.includes(workspaceId) && !publicWsIds.includes(workspaceId)) {
    res.status(401);
  }
};

import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deletePermissionById } from '../application/delete-permission-by-id.usecase';
import { getUsersInWorkspaceByWorkspaceId } from '../application/get-users-in-workspace-by-workspace-id.usecase';
import { postPermission } from '../application/post-permission.usecase';

const sendResponse = (
  res: Response,
  result: {
    statusCode?: number;
    body: unknown;
  },
) => res.status(result.statusCode ?? 200).json(result.body);

export const PermissionsController = {
  postPermission: async (req: AuthenticatedRequest, res: Response) => {
    const { email, workspaceId } = req.body;
    const result = await postPermission(email, workspaceId);
    sendResponse(res, result);
  },

  getUsersInWorkspace: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getUsersInWorkspaceByWorkspaceId(req.params.workspaceId);
    sendResponse(res, result);
  },

  deletePermission: async (req: AuthenticatedRequest, res: Response) => {
    const result = await deletePermissionById(req.params.permissionId);
    sendResponse(res, result);
  },
};

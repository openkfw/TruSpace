import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deletePermissionById } from '../application/delete-permission-by-id.usecase';
import { deletePermissionsRemoveAllByEmail } from '../application/delete-permissions-remove-all-by-email.usecase';
import { getUsersInWorkspaceByWorkspaceId } from '../application/get-users-in-workspace-by-workspace-id.usecase';
import { postPermission } from '../application/post-permission.usecase';

export const PermissionsController = {
  postPermission: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postPermission(req.body.email, req.body.workspaceId);
    res.json(result);
  },

  getUsersInWorkspace: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getUsersInWorkspaceByWorkspaceId(req.params.workspaceId);
    res.json(result);
  },

  deletePermission: async (req: AuthenticatedRequest, res: Response) => {
    const result = await deletePermissionById(req.params.permissionId);
    res.json(result);
  },

  deletePermissionsRemoveAllByEmail: async (req: AuthenticatedRequest, res: Response) => {
    const result = await deletePermissionsRemoveAllByEmail(req.params.email);
    res.json(result);
  },
};

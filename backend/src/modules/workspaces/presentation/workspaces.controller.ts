import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deleteWorkspaceById } from '../application/delete-workspace-by-id.usecase';
import { getWorkspaceContributors } from '../application/get-workspace-contributors.usecase';
import { getWorkspaces } from '../application/get-workspaces.usecase';
import { postWorkspace } from '../application/post-workspace.usecase';
import { updateWorkspaceType } from '../application/update-workspace-type.usecase';

const sendResponse = (
  res: Response,
  result: {
    statusCode?: number;
    body: unknown;
  },
) => res.status(result.statusCode ?? 200).json(result.body);

export const WorkspacesController = {
  getWorkspaces: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getWorkspaces(req.user?.email as string);
    sendResponse(res, result);
  },

  getWorkspaceContributors: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getWorkspaceContributors(req.params.wId);
    sendResponse(res, result);
  },

  postWorkspace: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postWorkspace(
      req.body.name,
      req.body.isPublic,
      req.body.workspacePassword,
      req.user?.nodeId as string,
      req.user?.uiid as string,
      req.user?.email as string,
    );

    sendResponse(res, result);
  },

  deleteWorkspace: async (req: Request, res: Response) => {
    const result = await deleteWorkspaceById(req.params.wCID, req.params.wUID);
    sendResponse(res, result);
  },

  updateWorkspaceType: async (req: AuthenticatedRequest, res: Response) => {
    const result = await updateWorkspaceType(req.params.wUID, req.body.isPublic, req.user?.email as string);

    sendResponse(res, result);
  },
};

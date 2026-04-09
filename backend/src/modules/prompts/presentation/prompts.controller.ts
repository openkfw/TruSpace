import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deletePrompt } from '../application/delete-prompt.usecase';
import { getPrompts } from '../application/get-prompts.usecase';
import { postPrompt } from '../application/post-prompt.usecase';
import { putPrompt } from '../application/put-prompt.usecase';

const sendResponse = (
  res: Response,
  result: {
    statusCode?: number;
    body: unknown;
  },
) => res.status(result.statusCode ?? 200).json(result.body);

export const PromptsController = {
  getPrompts: async (_req: AuthenticatedRequest, res: Response) => {
    const result = await getPrompts();
    sendResponse(res, result);
  },

  postPrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postPrompt(req.body.title, req.body.prompt, req.user?.uiid);
    sendResponse(res, result);
  },

  putPrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await putPrompt(req.params.title, {
      ...req.body,
      updated_by: req.user?.uiid,
    });

    sendResponse(res, result);
  },

  deletePrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await deletePrompt(req.params.title);
    sendResponse(res, result);
  },
};

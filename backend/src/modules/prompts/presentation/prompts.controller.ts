import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deletePrompt } from '../application/delete-prompt.usecase';
import { getPrompts } from '../application/get-prompts.usecase';
import { postPrompt } from '../application/post-prompt.usecase';
import { putPrompt } from '../application/put-prompt.usecase';

export const PromptsController = {
  getPrompts: async (_req: AuthenticatedRequest, res: Response) => {
    const result = await getPrompts();
    res.json(result);
  },

  postPrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postPrompt(req.body.title, req.body.prompt, req.user?.uiid);
    res.status(201).json(result);
  },

  putPrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await putPrompt(req.params.title, {
      ...req.body,
      updated_by: req.user?.uiid,
    });

    res.json(result);
  },

  deletePrompt: async (req: AuthenticatedRequest, res: Response) => {
    const result = await deletePrompt(req.params.title);
    res.json(result);
  },
};

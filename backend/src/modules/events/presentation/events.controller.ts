import { Request, Response } from 'express';

import { getEventsByDocumentId } from '../application/get-events-by-document-id.usecase';
import { getEventsByWorkspaceId } from '../application/get-events-by-workspace-id.usecase';

export const EventsController = {
  getEventsByDocumentId: async (req: Request, res: Response) => {
    const result = await getEventsByDocumentId(req.params.docId);
    res.json(result);
  },

  getEventsByWorkspaceId: async (req: Request, res: Response) => {
    const result = await getEventsByWorkspaceId(req.params.workspaceId);
    res.json(result);
  },
};

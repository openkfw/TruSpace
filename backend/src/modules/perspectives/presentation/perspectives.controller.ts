import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { getAllPerspectives } from '../application/get-all-perspectives.usecase';
import { getPerspectiveStatus } from '../application/get-perspective-status.usecase';
import { getPerspectivesByDocumentId } from '../application/get-perspectives-by-document-id.usecase';
import { getPerspectivesByVersionCid } from '../application/get-perspectives-by-version-cid.usecase';
import { postCustomPerspective } from '../application/post-custom-perspective.usecase';
import { postPerspective } from '../application/post-perspective.usecase';

export const PerspectivesController = {
  getPerspectiveStatus: async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const result = await getPerspectiveStatus(requestId);
    res.json(result);
  },

  getPerspectivesByVersionCid: async (req: Request, res: Response) => {
    const result = await getPerspectivesByVersionCid(req.params.cid);
    res.json(result);
  },

  getPerspectivesByDocumentId: async (req: Request, res: Response) => {
    const result = await getPerspectivesByDocumentId(req.params.documentId);
    res.json(result);
  },

  getAllPerspectives: async (_req: Request, res: Response) => {
    const result = await getAllPerspectives();
    res.json(result);
  },

  postPerspective: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postPerspective(
      req.body.perspectiveType,
      req.body.perspectiveText,
      req.body.workspaceOrigin,
      req.body.docId,
      req.body.cid,
      req.user?.nodeId as string,
      req.user?.uiid as string,
    );

    res.json(result);
  },

  postCustomPerspective: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postCustomPerspective(req.body.cid, req.body.prompt, req.body.promptTitle);
    res.json(result);
  },
};

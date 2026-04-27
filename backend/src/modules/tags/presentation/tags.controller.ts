import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { deleteTag } from '../application/delete-tag.usecase';
import { getTagStatus } from '../application/get-tag-status.usecase';
import { getTagsByDocumentId } from '../application/get-tags-by-document-id.usecase';
import { getTagsByVersionCid } from '../application/get-tags-by-version-cid.usecase';
import { postTag } from '../application/post-tag.usecase';

export const TagsController = {
  getTagStatus: async (req: Request, res: Response) => {
    const result = await getTagStatus(req.params.requestId);
    res.json(result);
  },

  postTag: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postTag(
      req.params.cid,
      req.body.name,
      req.body.color,
      req.body.workspaceOrigin,
      req.body.docId,
      req.user?.nodeId as string,
      req.user?.uiid as string,
      req.user?.email as string,
      res,
    );

    res.json(result);
  },

  deleteTag: async (req: Request, res: Response) => {
    const result = await deleteTag(req.params.tagId);
    res.json(result);
  },

  getTagsByVersionCid: async (req: Request, res: Response) => {
    const result = await getTagsByVersionCid(req.params.cid);
    res.json(result);
  },

  getTagsByDocumentId: async (req: Request, res: Response) => {
    const result = await getTagsByDocumentId(req.params.documentId);
    res.json(result);
  },
};

import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import logger from '../../../shared/config/winston';

import { getDocumentsByWorkspaceId } from '../application/get-documents-by-workspace-id.usecase';
import { deleteDocument } from '../application/delete-document.usecaste';
import { getDocumentsDetailByDocumentId } from '../application/get-documents-detail-by-document-id-usecase';
import { getDocumentsStatistics } from '../application/get-documents-statistics.usecaste';
import { getDocumentsStatsByDocumentId } from '../application/get-documents-stats-by-document-id.usecase';
import { getDocumentsVersionByCID } from '../application/get-documents-version-by-cid.usecase';
import { postDocument } from '../application/post-document.usecaste';
import { putDocument } from '../application/put-document.usecaste';

export const DocumentsController = {
  deleteDocument: async (req: AuthenticatedRequest, res: Response) => {
    const docId = req.params.docId;
    const email = req.user?.email as string;

    const result = await deleteDocument(docId, email, res);

    res.json({ result });
  },

  getDocumentsByWorkspaceId: async (req: AuthenticatedRequest, res: Response) => {
    const workspaceId = req.query.workspace as string;
    const from = parseInt(req.query.from as string) || 0;
    const limit = parseInt(req.query.limit as string) || 2;
    const searchString = req.query.search as string;
    const email = req.user?.email as string;

    const result = await getDocumentsByWorkspaceId(workspaceId, from, limit, searchString, email, res);

    res.json(result);
  },

  getDocumentsDetailByDocumentId: async (req: AuthenticatedRequest, res: Response) => {
    const documentId = req.params.docId;
    const email = req.user?.email as string;

    const result = await getDocumentsDetailByDocumentId(documentId, email, res);

    res.json(result);
  },

  getDocumentsStatistics: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await getDocumentsStatistics();

      res.json(result);
    } catch (err: any) {
      logger.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document statistics',
      });
    }
  },

  getDocumentsStatsByDocumentId: async (req: AuthenticatedRequest, res: Response) => {
    const { docId } = req.params;
    const email = req.user?.email as string;

    const result = await getDocumentsStatsByDocumentId(docId, email, res);

    res.json(result);
  },

  getDocumentsVersionByCID: async (req: Request, res: Response) => {
    const cid = req.params.cid;

    const result = await getDocumentsVersionByCID(cid, req, res);
    return result;
  },

  postDocument: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postDocument(req, res);

    res.json(result);
  },

  putDocument: async (req: AuthenticatedRequest, res: Response) => {
    const result = await putDocument(req, res);

    res.json(result);
  },
};

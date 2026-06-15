import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';

import { getDocumentsByWorkspaceId } from '../application/get-documents-by-workspace-id.usecase';
import { deleteDocument } from '../application/delete-document.usecase';
import { getDocumentsDetailByDocumentId } from '../application/get-documents-detail-by-document-id.usecase';
import { getDocumentsStatistics } from '../application/get-documents-statistics.usecaste';
import { getDocumentsStatsByDocumentId } from '../application/get-documents-stats-by-document-id.usecase';
import { getDocumentsVersionByCID } from '../application/get-documents-version-by-cid.usecase';
import { postDocument } from '../application/post-document.usecase';
import { putDocument } from '../application/put-document.usecase';

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
    const tagFilter = ([] as string[]).concat((req.query.tags as string | string[]) ?? []).filter(Boolean);
    const creatorFilter = ([] as string[]).concat((req.query.creators as string | string[]) ?? []).filter(Boolean);
    const sortBy = (req.query.sortBy as 'name' | 'timestamp') || 'timestamp';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const result = await getDocumentsByWorkspaceId(
      workspaceId, from, limit, searchString, email, res,
      tagFilter, creatorFilter, sortBy, sortOrder,
    );
    res.json(result);
  },

  getDocumentsDetailByDocumentId: async (req: AuthenticatedRequest, res: Response) => {
    const documentId = req.params.docId;
    const email = req.user?.email as string;
    const result = await getDocumentsDetailByDocumentId(documentId, email, res);
    res.json(result);
  },

  getDocumentsStatistics: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getDocumentsStatistics();
    res.json(result);
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

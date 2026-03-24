import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import {
  getDocumentsByDocumentIdValidator,
  validateCID,
  validateDocumentId,
  putDocumentValidator,
  postDocumentValidator,
} from './documents.validators.';
import { DocumentsController } from './documents.controller';

export const documentsRouter = express.Router();

documentsRouter.delete('/documents/:docId', authenticateCookie, validateDocumentId, DocumentsController.deleteDocument);

documentsRouter.get(
  '/documents',
  authenticateCookie,
  getDocumentsByDocumentIdValidator,
  DocumentsController.getDocumentsByWorkspaceId,
);

documentsRouter.get(
  '/documents/detail/:docId',
  authenticateCookie,
  validateDocumentId,
  DocumentsController.getDocumentsDetailByDocumentId,
);

documentsRouter.get('/documents/statistics', authenticateCookie, DocumentsController.getDocumentsStatistics);

documentsRouter.get(
  '/documents/stats/:docId',
  authenticateCookie,
  validateDocumentId,
  DocumentsController.getDocumentsStatsByDocumentId,
);

documentsRouter.get(
  '/documents/version/:cid',
  authenticateCookie,
  validateCID,
  DocumentsController.getDocumentsVersionByCID,
);

documentsRouter.post('/documents', authenticateCookie, postDocumentValidator, DocumentsController.postDocument);

documentsRouter.put('/documents/:docId', authenticateCookie, putDocumentValidator, DocumentsController.putDocument);

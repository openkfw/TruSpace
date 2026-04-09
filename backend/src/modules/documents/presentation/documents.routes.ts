import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { DocumentsValidator } from './documents.validators.';
import { DocumentsController } from './documents.controller';

export const documentsRouter = express.Router();

documentsRouter.delete('/documents/:docId', authenticateCookie, DocumentsValidator.validateDocumentId, DocumentsController.deleteDocument);

documentsRouter.get(
  '/documents',
  authenticateCookie,
  DocumentsValidator.getDocumentsByDocumentId,
  DocumentsController.getDocumentsByWorkspaceId,
);

documentsRouter.get(
  '/documents/detail/:docId',
  authenticateCookie,
  DocumentsValidator.validateDocumentId,
  DocumentsController.getDocumentsDetailByDocumentId,
);

documentsRouter.get('/documents/statistics', authenticateCookie, DocumentsController.getDocumentsStatistics);

documentsRouter.get(
  '/documents/stats/:docId',
  authenticateCookie,
  DocumentsValidator.validateDocumentId,
  DocumentsController.getDocumentsStatsByDocumentId,
);

documentsRouter.get(
  '/documents/version/:cid',
  authenticateCookie,
  DocumentsValidator.validateCID,
  DocumentsController.getDocumentsVersionByCID,
);

documentsRouter.post('/documents', authenticateCookie, DocumentsValidator.postDocumentValidator, DocumentsController.postDocument);

documentsRouter.put('/documents/:docId', authenticateCookie, DocumentsValidator.putDocumentValidator, DocumentsController.putDocument);

import { param } from 'express-validator';
import validate from '../../../shared/middlewares/validate';

export const LanguageValidator = {
  getLanguageStatus: validate([param('requestId').notEmpty()]),

  getLanguageByDocumentId: validate([param('documentId').notEmpty()]),
};

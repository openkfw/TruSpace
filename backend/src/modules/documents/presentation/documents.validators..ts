import { body, param, query } from 'express-validator';
import validate from '../../../shared/middlewares/validate';

export const DocumentsValidator = {
  getDocumentsByDocumentId: validate([
    query('workspace').isUUID(4).optional(),
    query('from').isInt().optional(),
    query('limit').isInt().optional(),
    query('search').isString().optional(),
  ]),

  validateDocumentId: validate([param('docId').isUUID(4)]),

  validateCID: validate([param('cid').notEmpty()]),

  postDocumentValidator: validate([body('workspace').isString().notEmpty()]),

  putDocumentValidator: validate([
    param('docId').isUUID(4),
    body('workspace').isString().notEmpty(),
    body('versionTagName').isString().isLength({ max: 50 }),
  ]),
};

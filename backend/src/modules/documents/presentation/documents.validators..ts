import { body, param, query } from 'express-validator';
import validate from '../../../shared/middlewares/validate';

export const getDocumentsByDocumentIdValidator = validate([
  query('workspace').isUUID(4).optional(),
  query('from').isInt().optional(),
  query('limit').isInt().optional(),
  query('search').isString().optional(),
]);

export const validateDocumentId = validate([param('docId').isUUID(4)]);

export const validateCID = validate([param('cid').notEmpty()]);

export const postDocumentValidator = validate([body('workspace').isString().notEmpty()]);

export const putDocumentValidator = validate([
  param('docId').isUUID(4),
  body('workspace').isString().notEmpty(),
  body('versionTagName').isString().isLength({ max: 50 }),
]);

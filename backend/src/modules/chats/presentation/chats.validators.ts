import { body, param } from 'express-validator';
import validate from '../../../shared/middlewares/validate';

export const getChatsByDocumentIdValidation = validate([param('docId').isUUID(4)]);

export const postChatValidation = validate([
  body('cid').notEmpty(),
  body('docId').isUUID(4),
  body('workspaceOrigin').isUUID(4),
  body('data').notEmpty(),
]);

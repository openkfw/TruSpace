import { body, param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const TagsValidator = {
  getTagStatus: validate([param('requestId').notEmpty()]),

  postTag: validate([
    param('cid').notEmpty(),
    body('name').notEmpty(),
    body('color').optional({ nullable: true }),
    body('workspaceOrigin').notEmpty(),
    body('docId').isUUID(4),
  ]),

  deleteTag: validate([param('tagId').notEmpty()]),

  getTagsByVersionCid: validate([param('cid').notEmpty()]),

  getTagsByDocumentId: validate([param('documentId').notEmpty()]),
};

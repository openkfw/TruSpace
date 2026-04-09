import { body, param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const PerspectivesValidator = {
  getPerspectiveStatus: validate([param('requestId').notEmpty()]),

  getPerspectivesByVersionCid: validate([param('cid').notEmpty()]),

  getPerspectivesByDocumentId: validate([param('documentId').isUUID(4)]),

  postPerspective: validate([
    body('perspectiveType').isString().notEmpty(),
    body('perspectiveText').isString().notEmpty(),
    body('workspaceOrigin').isUUID(4).notEmpty(),
    body('docId').isUUID(4).notEmpty(),
    body('cid').isString().notEmpty(),
  ]),

  postCustomPerspective: validate([
    body('promptTitle').isString().notEmpty(),
    body('prompt').isString().notEmpty(),
    body('workspaceOrigin').isUUID(4).notEmpty(),
    body('docId').isUUID(4).notEmpty(),
    body('cid').isString().notEmpty(),
  ]),
};

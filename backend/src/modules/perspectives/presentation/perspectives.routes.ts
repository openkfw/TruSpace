import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { PerspectivesController } from './perspectives.controller';
import { PerspectivesValidator } from './perspectives.validators';

export const perspectivesRouter = express.Router();

perspectivesRouter.get(
  '/perspectives/status/:requestId',
  authenticateCookie,
  PerspectivesValidator.getPerspectiveStatus,
  PerspectivesController.getPerspectiveStatus,
);

perspectivesRouter.get(
  '/perspectives/version/:cid',
  authenticateCookie,
  PerspectivesValidator.getPerspectivesByVersionCid,
  PerspectivesController.getPerspectivesByVersionCid,
);

perspectivesRouter.get(
  '/perspectives/:documentId',
  authenticateCookie,
  PerspectivesValidator.getPerspectivesByDocumentId,
  PerspectivesController.getPerspectivesByDocumentId,
);

perspectivesRouter.get('/perspectives', authenticateCookie, PerspectivesController.getAllPerspectives);

perspectivesRouter.post(
  '/perspectives',
  authenticateCookie,
  PerspectivesValidator.postPerspective,
  PerspectivesController.postPerspective,
);

perspectivesRouter.post(
  '/perspectives/generate-custom',
  authenticateCookie,
  PerspectivesValidator.postCustomPerspective,
  PerspectivesController.postCustomPerspective,
);

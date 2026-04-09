import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { TagsController } from './tags.controller';
import { TagsValidator } from './tags.validators';

export const tagsRouter = express.Router();

tagsRouter.get('/tags/status/:requestId', authenticateCookie, TagsValidator.getTagStatus, TagsController.getTagStatus);

tagsRouter.post('/tags/version/:cid', authenticateCookie, TagsValidator.postTag, TagsController.postTag);

tagsRouter.delete('/tags/:tagId', authenticateCookie, TagsValidator.deleteTag, TagsController.deleteTag);

tagsRouter.get(
  '/tags/version/:cid',
  authenticateCookie,
  TagsValidator.getTagsByVersionCid,
  TagsController.getTagsByVersionCid,
);

tagsRouter.get(
  '/tags/:documentId',
  authenticateCookie,
  TagsValidator.getTagsByDocumentId,
  TagsController.getTagsByDocumentId,
);

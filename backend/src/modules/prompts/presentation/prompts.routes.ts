import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { PromptsController } from './prompts.controller';
import { PromptsValidator } from './prompts.validators';

export const promptsRouter = express.Router();

promptsRouter.get('/prompts', authenticateCookie, PromptsController.getPrompts);

promptsRouter.post('/prompts', authenticateCookie, PromptsValidator.postPrompt, PromptsController.postPrompt);

promptsRouter.put('/prompts/:title', authenticateCookie, PromptsValidator.putPrompt, PromptsController.putPrompt);

promptsRouter.delete(
  '/prompts/:title',
  authenticateCookie,
  PromptsValidator.deletePrompt,
  PromptsController.deletePrompt,
);

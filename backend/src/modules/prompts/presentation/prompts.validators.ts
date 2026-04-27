import { body, param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const PromptsValidator = {
  postPrompt: validate([body('title').isString().notEmpty(), body('prompt').isString().notEmpty()]),

  putPrompt: validate([
    param('title').isString().notEmpty(),
    body('title').isString().optional(),
    body('prompt').isString().optional(),
    body('updated_by').isString().optional(),
  ]),

  deletePrompt: validate([param('title').isString().notEmpty()]),
};

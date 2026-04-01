import { body, param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const WorkspacesValidator = {
  getWorkspaceContributors: validate([param('wId').isString().notEmpty()]),

  postWorkspace: validate([
    body('name').isString().notEmpty(),
    body('workspacePassword').isString().isLength({ min: 3 }).optional(),
  ]),

  deleteWorkspace: validate([param('wCID').isString().notEmpty(), param('wUID').isString().notEmpty()]),

  updateWorkspaceType: validate([body('isPublic').isBoolean().notEmpty(), param('wUID').isString().notEmpty()]),
};

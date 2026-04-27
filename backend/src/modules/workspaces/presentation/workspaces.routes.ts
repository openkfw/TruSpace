import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { WorkspacesController } from './workspaces.controller';
import { WorkspacesValidator } from './workspaces.validators';

export const workspacesRouter = express.Router();

workspacesRouter.get('/workspaces', authenticateCookie, WorkspacesController.getWorkspaces);

workspacesRouter.get(
  '/workspaces/contributors/:wId',
  authenticateCookie,
  WorkspacesValidator.getWorkspaceContributors,
  WorkspacesController.getWorkspaceContributors,
);

workspacesRouter.post(
  '/workspaces',
  authenticateCookie,
  express.json(),
  WorkspacesValidator.postWorkspace,
  WorkspacesController.postWorkspace,
);

workspacesRouter.delete(
  '/workspaces/:wCID/:wUID',
  authenticateCookie,
  WorkspacesValidator.deleteWorkspace,
  WorkspacesController.deleteWorkspace,
);

workspacesRouter.put(
  '/workspaces/:wUID',
  authenticateCookie,
  WorkspacesValidator.updateWorkspaceType,
  WorkspacesController.updateWorkspaceType,
);

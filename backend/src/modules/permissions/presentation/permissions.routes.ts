import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { PermissionsController } from './permissions.controller';
import { PermissionsValidator } from './permissions.validators';

export const permissionsRouter = express.Router();

permissionsRouter.post(
  '/permissions',
  authenticateCookie,
  express.json(),
  PermissionsValidator.postPermission,
  PermissionsController.postPermission,
);

permissionsRouter.get(
  '/permissions/users-in-workspace/:workspaceId',
  authenticateCookie,
  PermissionsValidator.getUsersInWorkspace,
  PermissionsController.getUsersInWorkspace,
);

permissionsRouter.delete(
  '/permissions/users-in-workspace/remove/:permissionId',
  authenticateCookie,
  PermissionsValidator.deletePermission,
  PermissionsController.deletePermission,
);

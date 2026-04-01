import { body, param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const PermissionsValidator = {
  postPermission: validate([body('email').isString().notEmpty(), body('workspaceId').isString().notEmpty()]),

  getUsersInWorkspace: validate([param('workspaceId').isString().notEmpty()]),

  deletePermission: validate([param('permissionId').isString().notEmpty()]),
};

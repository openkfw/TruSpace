import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { UsersController } from './users.controller';
import { UsersValidator } from './users.validators';

export const usersRouter = express.Router();

usersRouter.post('/users/register', UsersValidator.postUsersRegister, UsersController.postUsersRegister);

usersRouter.post('/users/login', UsersValidator.postUsersLogin, UsersController.postUsersLogin);

usersRouter.post('/users/logout', UsersController.postUsersLogout);

usersRouter.post(
  '/users/forgot-password',
  UsersValidator.postUsersForgotPassword,
  UsersController.postUsersForgotPassword,
);
usersRouter.post(
  '/users/confirm-registration',
  UsersValidator.postUsersConfirmRegistration,
  UsersController.postUsersConfirmRegistration,
);

usersRouter.post('/users/user-settings', authenticateCookie, UsersController.postUsersUserSettings);

usersRouter.post(
  '/users/reset-name',
  authenticateCookie,
  UsersValidator.postUsersResetName,
  UsersController.postUsersResetName,
);

usersRouter.post(
  '/users/reset-password',
  UsersValidator.postUsersResetPassword,
  UsersController.postUsersResetPassword,
);

usersRouter.get('/users/statistics', authenticateCookie, UsersController.getUsersStatistics);

usersRouter.get('/users/user-settings', authenticateCookie, UsersController.getUsersUserSettings);

usersRouter.get('/users/avatar', authenticateCookie, UsersController.getUsersAvatar);

usersRouter.delete('/users/delete-user', authenticateCookie, UsersController.deleteUser);

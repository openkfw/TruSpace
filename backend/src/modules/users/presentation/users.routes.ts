import express, { Request, Response } from 'express';
import { body, query } from 'express-validator';

import { authenticateCookie } from '../middlewares/authenticate';
import validate from '../middlewares/validate';
import { UsersController } from './users.controller';

export const usersRouter = express.Router();

usersRouter.post(
  '/users/register',
  validate([
    body('name').isString().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isString(),
    body('confirmPassword').isString(),
    body('confirmationLink').isString(),
    body('lang').isString(),
  ]),
  UsersController.postUsersRegister
);

usersRouter.post('/users/login', [body('email').isEmail(), body('password').isString()], UsersController.postUsersLogin);

usersRouter.post('/users/logout', UsersController.postUsersLogout);

usersRouter.get('/users/statistics', authenticateCookie, UsersController.getUsersStatistic);

usersRouter.post(
  '/users/confirm-registration',
  validate([query('token').isString().notEmpty(), body('confirmationLink').isString(), body('lang').isString()]),
  UsersController.postUsersConfirmRegistration
);

usersRouter.get('/users/user-settings', authenticateCookie, UsersController.getUsersUserSettings);

usersRouter.post('/users/user-settings', authenticateCookie, UsersController.postUsersUserSettings);

usersRouter.get('/users/avatar', authenticateCookie, UsersController.getUsersAvatar);

usersRouter.post(
  '/users/forgot-password',
  validate([body('email').isEmail(), body('resetPasswordLink').isString(), body('lang').isString()]),
  UsersController.postUsersForgotPassword
);

usersRouter.post('/users/reset-name', authenticateCookie, validate([body('name').isString().isLength({ min: 3 })])
  UsersController.postUsersResetName
);

usersRouter.post('/users/reset-password', validate([body('password').isString(), body('token').isString()])
UsersController.postUsersResetPassword);

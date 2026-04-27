import { body, param, query } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const UsersValidator = {
  postUsersRegister: validate([
    body('name').isString().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isString(),
    body('confirmPassword').isString(),
    body('confirmationLink').isString(),
    body('lang').isString(),
  ]),

  postUsersLogin: [body('email').isEmail(), body('password').isString()],

  postUsersConfirmRegistration: validate([
    query('token').isString().notEmpty(),
    body('confirmationLink').isString(),
    body('lang').isString(),
  ]),

  postUsersForgotPassword: validate([
    body('email').isEmail(),
    body('resetPasswordLink').isString(),
    body('lang').isString(),
  ]),

  postUsersResetName: validate([body('name').isString().isLength({ min: 3 })]),

   postUsersResetPassword: validate([body('password').isString(), body('token').isString()]),

   getUsersAvatar: validate([param('cid').isString().notEmpty()]),
};

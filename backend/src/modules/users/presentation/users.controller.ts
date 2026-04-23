import { Request, Response } from 'express';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { AuthenticatedRequest } from '../../../shared/types';
import { getUsersAvatar } from '../application/get-users-avatar.usecase';
import { getUsersStatistics } from '../application/get-users-statistics.usecase';
import { getUsersUserSettings } from '../application/get-users-user-settings.usecase';
import { postUsersLogin } from '../application/post-users-login.usecase';
import { postUsersConfirmRegistration } from '../application/post-users-confirm-registration.usecase';
import { postUsersForgotPassword } from '../application/post-users-forgot-password.usecase';
import { postUsersRegister } from '../application/post-users-register.usecase';
import { postUsersResetName } from '../application/post-users-reset-name.usecase';
import { postUsersResetPassword } from '../application/post-users-reset-password.usecase';
import { postUsersUserSettings } from '../application/post-users-user-settings.usecase';
import { deleteUser } from '../application/delete-user.usecase';

export const UsersController = {
  postUsersRegister: async (req: Request, res: Response) => {
    const { name, email, password, confirmationLink, lang } = req.body;
    const result = await postUsersRegister(name, email, password, confirmationLink, lang);
    res.json(result);
  },

  postUsersLogin: async (req: Request, res: Response) => {
    await postUsersLogin(req, res);
  },

  postUsersLogout: (_req: Request, res: Response) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  },

  getUsersStatistics: async (_req: Request, res: Response) => {
    const result = await getUsersStatistics();
    res.json(result);
  },

  postUsersConfirmRegistration: async (req: Request, res: Response) => {
    const result = await postUsersConfirmRegistration(
      req.query.token as string,
      req.body.lang,
      req.body.confirmationLink,
    );

    res.json(result);
  },

  getUsersUserSettings: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getUsersUserSettings(req.user?.email as string);
    res.json(result);
  },

  postUsersUserSettings: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postUsersUserSettings(req);
    res.json(result);
  },

   getUsersAvatarCid: async (req: AuthenticatedRequest, res: Response) => {
      const cid = await getUsersAvatar(req.user?.email as string);
      res.json({ cid });
   },

   getUsersAvatar: async (req: AuthenticatedRequest, res: Response) => {
     const cid = req.params.cid as string;
     return new IpfsClient().downloadAvatar(req, res, cid);
  },

  postUsersForgotPassword: async (req: Request, res: Response) => {
    const result = await postUsersForgotPassword(req.body.email, req.body.resetPasswordLink, req.body.lang);

    res.json(result);
  },

  postUsersResetName: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postUsersResetName(req.user?.email, req.body.name, req.user?.nodeId, req.user?.uiid);

    res.json(result);
  },

  postUsersResetPassword: async (req: Request, res: Response) => {
    const result = await postUsersResetPassword(req.body.password, req.body.token);
    res.json(result);
  },

  deleteUser: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.uiid;
    const nodeId = req.user?.nodeId;
    const result = await deleteUser(userId as string, nodeId);
    res.json(result);
  },
};

import { Request, Response } from 'express';
import postUsersRegister from '../application/post-users-register.usecase';
import postUsersLogin from '../application/post-users-login.usecase';

export const UserController = {
  postUsersRegister: async (req: Request, res: Response) => {
    const { name, email, password, confirmationLink, lang } = req.body;

    const result = await postUsersRegister(name, email, password, confirmationLink, lang, res);

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
    try {
      const totalUsers = await getTotalUsersDb();
      const recentlyAddedUsers = await getTotalRecentlyAddedUsersDb();
      res.status(200).json({
        status: 'success',
        data: {
          totalUsers,
          recentlyAddedUsers,
        },
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        status: 'failure',
        message: 'Unable to fetch statistics',
      });
    }
  },

  postUsersConfirmRegistration: async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const { lang, confirmationLink } = req.body;

    try {
      jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
      const user = await findUserByTokenDb(token);
      if (user) {
        await activateUserDb(user.id);
        await updateUserToken(user.id, '');
        res.status(200).json({
          status: 'success',
          message: 'User activated successfully',
        });
      } else {
        res.status(400).json({
          status: 'failure',
          message: 'Invalid token',
        });
      }
    } catch (error: any) {
      logger.error(error);
      if (error.message === 'jwt expired') {
        try {
          const user = await findUserByTokenDb(token);
          if (user) {
            const newToken = jwt.sign({ email: user.email }, Buffer.from(config.jwt.secret), {
              expiresIn: CONFIRMATION_EMAIL_EXPIRATION, // 20 minutes
            });
            await updateUserToken(user.id, newToken);
            const filePath = path.join(process.cwd(), 'src/mailing/templates/registrationConfirmation.html');
            const source = fs.readFileSync(filePath, 'utf-8');
            const template = compile(source);
            const replacements = {
              lang: lang,
              header: registrationConfirmation[lang].header,
              user: user.username,
              text: registrationConfirmation[lang].text,
              confirmRegistrationUrl: `${confirmationLink}?token=${newToken}`,
              confirmRegistrationTitle: registrationConfirmation[lang].link,
              footer: registrationConfirmation[lang].footer,
            };
            const htmlTemplateToSend = template(replacements);
            logger.info('Sending email');
            await sendEmail(user.email, registrationConfirmation[lang].subject, htmlTemplateToSend);
            logger.info('New confirmation email sent');
            return res.status(400).json({
              status: 'error',
              message: 'expired token',
            });
          }
          return res.status(500).json({
            status: 'failure',
            message: 'Unknown error occurred',
          });
        } catch (err) {
          logger.error(err);
          return res.status(500).json({
            status: 'failure',
            message: 'Unknown error occurred',
          });
        }
      } else if (error.message === 'invalid signature') {
        res.status(400).json({
          status: 'error',
          message: 'invalid token',
        });
      } else {
        res.status(500).json({
          status: 'failure',
          message: 'Unknown error occurred',
        });
      }
    }
  },

  getUsersUserSettings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userSettings = await getUserSettings(req.user?.email as string);
      if (!userSettings) {
        return res.status(404).json({
          status: 'failure',
          message: 'User not found',
        });
      }
      return res.json({
        status: 'success',
        data: {
          ...userSettings,
        },
      });
    } catch (error) {
      logger.error(`Error fetching user settings: ${JSON.stringify(error, null, 2)}`);
      res.status(500).json({
        status: 'failure',
        message: 'User settings fetch failed',
      });
    }
  },

  postUsersUserSettings: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req?.files?.file as UploadedFile;

      let avatarCid: string | undefined = undefined;
      if (file) {
        const client = new IpfsClient();
        avatarCid = await client.uploadAvatar(file);
      }

      const addedToWorkspace = req.body.notificationAddedToWorkspace === 'true';
      const removedFromWorkspace = req.body.notificationRemovedFromWorkspace === 'true';
      const documentChanged = req.body.notificationDocumentChanged === 'true';
      const documentChat = req.body.notificationDocumentChat === 'true';
      const workspaceChange = req.body.notificationWorkspaceChange === 'true';
      const preferedLanguage = req.body.preferedLanguage || 'en';

      const notificationSettings = {
        addedToWorkspace,
        removedFromWorkspace,
        documentChanged,
        documentChat,
        workspaceChange,
      };

      await storeUserSettingsDb(req.user?.email as string, {
        avatarCid,
        preferedLanguage,
        notificationSettings: JSON.stringify(notificationSettings),
      });
      return res.json({
        status: 'success',
        message: 'User settings updated successfully',
      });
    } catch (error) {
      logger.error(`Error uploading avatar: ${JSON.stringify(error, null, 2)}`);
      res.status(500).json({
        status: 'failure',
        message: 'User settings update failed',
      });
    }
  },

  getUsersAvatar: async (req: AuthenticatedRequest, res: Response) => {
    const user = await findUserByEmailDb(req.user?.email as string);
    const cid = user?.avatar_cid;
    if (!cid) {
      return res.status(404).json({ status: 'failure', message: 'Could not find avatar' });
    }
    return new IpfsClient().downloadAvatar(req, res, cid);
  },

  postUsersForgotPassword: async (req: Request, res: Response) => {
    const { email, resetPasswordLink, lang } = req.body;
    const { smtpServer } = config;

    if (!smtpServer.host || !smtpServer.port) {
      logger.error('SMTP server not set');
      return res.status(500).json({
        status: 'error',
        message: 'SMTP server not set',
      });
    }

    try {
      const user = await findUserByEmailDb(email);
      if (!user) {
        logger.info('No such user');
        return res.status(200).json({
          status: 'success',
          message: 'email sent',
        });
      }
      const token = jwt.sign({ email: email }, Buffer.from(config.jwt.secret), {
        expiresIn: 1200, // 20 minutes
      });
      await createTokenDb(user.id, token);
      const filePath = path.join(process.cwd(), 'src/mailing/templates/resetPasswordEmail.html');
      const source = fs.readFileSync(filePath, 'utf-8');
      const template = compile(source);
      const replacements = {
        lang: lang,
        header: passwordReset[lang].header,
        user: user.username,
        text: passwordReset[lang].text,
        resetPasswordUrl: `${resetPasswordLink}?token=${token}`,
        resetPasswordUrlTitle: passwordReset[lang].link,
        footer: passwordReset[lang].footer,
      };
      const htmlTemplateToSend = template(replacements);

      await sendEmail(email, passwordReset[lang].subject, htmlTemplateToSend);
      res.json({
        status: 'success',
        message: 'email sent',
      });
    } catch (error: any) {
      logger.error(error);
      res.status(500).json({
        status: 'failure',
        message: 'Unknown error occurred',
      });
    }
  },

  postUsersResetName: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await updateUserName(email, req.body.name);

      const nodeId = await resolveNodeId(req.user?.nodeId);
      const userId = req.user?.uiid;
      if (nodeId && userId) {
        try {
          await new IpfsClient().modifyUserData({
            nodeId,
            userId,
            userName: req.body.name,
          });
        } catch (error) {
          logger.error('Error updating user data:', error);
        }
      }

      return res.json({
        status: 'success',
        message: 'Name updated successfully',
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        status: 'failure',
        message: 'Could not update name',
      });
    }
  },

  postUsersResetPassword: async (req: Request, res: Response) => {
    const { password, token } = req.body;

    try {
      jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
      const result = await getTokenDb(token);

      if (!result) {
        logger.error('invalid token');
        return res.status(400).json({
          status: 'error',
          message: 'invalid token',
        });
      }

      const passwordHash = await hashPassword(password);
      await updateUserPassword(result.user_id, passwordHash);
      await removeTokensOfUserDb(result.user_id);
      res.json({
        status: 'success',
        message: 'password set',
      });
    } catch (error: any) {
      logger.error(error);
      if (error.message === 'jwt expired' || error.message === 'invalid signature') {
        res.status(400).json({
          status: 'error',
          message: 'invalid token',
        });
      } else {
        res.status(500).json({
          status: 'failure',
          message: 'Unknown error occurred',
        });
      }
    }
  },
};

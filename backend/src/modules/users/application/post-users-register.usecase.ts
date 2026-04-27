import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { compile } from 'handlebars';

import { USER_EMAIL_TAKEN_ERROR, createUserDb, findUserByEmailDb, deleteUserByUiid } from '../../../shared/clients/db';
import { hashPassword } from '../../../shared/encryption';
import { HttpError, InternalServerError } from '../../../shared/errors';
import { sendEmail } from '../../../shared/mailing/mailing';
import { registrationConfirmation } from '../../../shared/mailing/mailingConstants';
import { CONFIRMATION_EMAIL_EXPIRATION, USER_STATUS } from '../../../shared/utility/constants';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { UserConflictError } from '../errors/user-conflict.error';
import { usersIpfsRepository } from '../infrastructure/users-ipfs.repository';

const resolveNodeId = async (explicitNodeId?: string): Promise<string> => {
  if (explicitNodeId) {
    return explicitNodeId;
  }

  try {
    return await usersIpfsRepository.resolveNodeId();
  } catch (error) {
    logger.error('Error resolving nodeId:', error);
    return '';
  }
};

export async function postUsersRegister(
  name: string,
  email: string,
  password: string,
  confirmationLink: string,
  lang: string | number,
) {
  const { registerUsersAsInactive, smtpServer } = config;

  if (registerUsersAsInactive && (!smtpServer.host || !smtpServer.port)) {
    logger.error('SMTP server not set');
    throw new InternalServerError('SMTP server not set');
  }

  const passwordHash = await hashPassword(password);
  const token = config.registerUsersAsInactive
    ? jwt.sign({ email: email }, Buffer.from(config.jwt.secret), {
        expiresIn: CONFIRMATION_EMAIL_EXPIRATION, // 20 minutes
      })
    : '';

  const cleanupCreatedUser = async () => {
    try {
      const user = await findUserByEmailDb(email);

      if (user) {
        await deleteUserByUiid(user.uiid);
      }
    } catch (cleanupError) {
      logger.error(`Error cleaning up user after failed registration (${email}):`, cleanupError);
    }
  };

  try {
    if (registerUsersAsInactive) {
      logger.info('Register user as inactive');
      const result = await createUserDb(
        name,
        email,
        passwordHash,
        registerUsersAsInactive ? USER_STATUS.inactive : USER_STATUS.active,
        token,
      );
      if (!result) {
        throw new InternalServerError(`Failed to create user (${email})`);
      }

      const createdUser = await findUserByEmailDb(email);
      const nodeId = await resolveNodeId();
      if (createdUser?.uiid && nodeId) {
        try {
          await usersIpfsRepository.createUserData({
            nodeId,
            userId: createdUser.uiid,
            userName: name,
          });
        } catch (error) {
          logger.error('Error creating user data:', error);
        }
      }

      const filePath = path.join(process.cwd(), 'src/mailing/templates/registrationConfirmation.html');
      const source = fs.readFileSync(filePath, 'utf-8');
      const template = compile(source);
      const replacements = {
        lang: lang,
        header: registrationConfirmation[lang].header,
        user: name,
        text: registrationConfirmation[lang].text,
        confirmRegistrationUrl: `${confirmationLink}?token=${token}`,
        confirmRegistrationTitle: registrationConfirmation[lang].link,
        footer: registrationConfirmation[lang].footer,
      };
      const htmlTemplateToSend = template(replacements);
      logger.info('Sending email');
      await sendEmail(email, registrationConfirmation[lang].subject, htmlTemplateToSend);
      logger.info('Email sent');
      return {
        status: 'success',
        message: 'email sent',
      };
    } else {
      logger.info('Registering user');
      const result = await createUserDb(
        name,
        email,
        passwordHash,
        registerUsersAsInactive ? USER_STATUS.inactive : USER_STATUS.active,
        token,
      );
      if (!result) {
        throw new InternalServerError(`Failed to create user (${email})`);
      }

      const createdUser = await findUserByEmailDb(email);
      const nodeId = await resolveNodeId();
      if (createdUser?.uiid && nodeId) {
        try {
          await usersIpfsRepository.createUserData({
            nodeId,
            userId: createdUser.uiid,
            userName: name,
          });
        } catch (error) {
          logger.error('Error creating user data:', error);
        }
      }

      return {
        status: 'success',
        message: 'Your registration request has been processed',
      };
    }
  } catch (error: unknown) {
    logger.error(error);

    if (error instanceof Error && error.message === USER_EMAIL_TAKEN_ERROR) {
      throw new UserConflictError(email, error);
    }

    await cleanupCreatedUser();

    if (error instanceof HttpError) {
      throw error;
    }

    throw new InternalServerError(`Failed to register user (${email})`, error);
  }
}

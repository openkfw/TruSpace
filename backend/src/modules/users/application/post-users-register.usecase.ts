import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Response } from 'express';
import { compile } from 'handlebars';

import { createUserDb, findUserByEmailDb, deleteUserById } from '../../../shared/clients/db';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { hashPassword } from '../../../shared/encryption';
import { sendEmail } from '../../../shared/mailing/mailing';
import { registrationConfirmation } from '../../../shared/mailing/mailingConstants';
import { CONFIRMATION_EMAIL_EXPIRATION, USER_STATUS } from '../../../shared/utility/constants';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';

const resolveNodeId = async (explicitNodeId?: string): Promise<string> => {
  if (explicitNodeId) {
    return explicitNodeId;
  }

  try {
    const clusterId = await new IpfsClient().clusterId();
    return clusterId?.ipfs?.id || '';
  } catch (error) {
    logger.error('Error resolving nodeId:', error);
    return '';
  }
};

export default async function postUsersRegister(
  name: string,
  email: string,
  password: string,
  confirmationLink: string,
  lang: string | number,
  res: Response,
) {
  const { registerUsersAsInactive, smtpServer } = config;

  const passwordHash = await hashPassword(password);
  const token = config.registerUsersAsInactive
    ? jwt.sign({ email: email }, Buffer.from(config.jwt.secret), {
        expiresIn: CONFIRMATION_EMAIL_EXPIRATION, // 20 minutes
      })
    : '';
  try {
    if (registerUsersAsInactive) {
      if (!smtpServer.host || !smtpServer.port) {
        logger.error('SMTP server not set');
        return res.status(500).json({
          status: 'error',
          message: 'SMTP server not set',
        });
      }
      logger.info('Register user as inactive');
      const result = await createUserDb(
        name,
        email,
        passwordHash,
        registerUsersAsInactive ? USER_STATUS.inactive : USER_STATUS.active,
        token,
      );
      if (!result) {
        throw Error('Unknown error');
      }

      const createdUser = await findUserByEmailDb(email);
      const nodeId = await resolveNodeId();
      if (createdUser?.uiid && nodeId) {
        try {
          await new IpfsClient().createUserData({
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
        throw Error('Unknown error');
      }

      const createdUser = await findUserByEmailDb(email);
      const nodeId = await resolveNodeId();
      if (createdUser?.uiid && nodeId) {
        try {
          await new IpfsClient().createUserData({
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
  } catch (error: any) {
    logger.error(error);
    if (error.message === 'email taken') {
      res.status(400).json({
        status: 'failure',
        message: 'Email address is already registered',
      });
    } else {
      const user = await findUserByEmailDb(email);
      if (user) {
        await deleteUserById(user.id);
      }
      res.status(500).json({
        status: 'failure',
        message: 'Unknown error occurred',
      });
    }
  }
}

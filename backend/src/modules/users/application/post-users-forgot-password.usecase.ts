import fs from 'fs';
import path from 'path';

import { compile } from 'handlebars';
import jwt from 'jsonwebtoken';

import { findUserByEmailDb } from '../../../shared/clients/db';
import { createTokenDb } from '../../../shared/clients/db/resetPasswordTokens';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { HttpError, InternalServerError } from '../../../shared/errors';
import { sendEmail } from '../../../shared/mailing/mailing';
import { passwordReset } from '../../../shared/mailing/mailingConstants';

export async function postUsersForgotPassword(email: string, resetPasswordLink: string, lang: string) {
  const { smtpServer } = config;

  if (!smtpServer.host || !smtpServer.port) {
    logger.error('SMTP server not set');
    throw new InternalServerError('SMTP server not set');
  }

  try {
    const user = await findUserByEmailDb(email);

    if (!user) {
      logger.info('No such user');
      return {
        status: 'success',
        message: 'email sent',
      };
    }

    const token = jwt.sign({ email }, Buffer.from(config.jwt.secret), {
      expiresIn: 1200,
    });

    await createTokenDb(user.id, token);

    const filePath = path.join(process.cwd(), 'src/shared/mailing/templates/resetPasswordEmail.html');
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = compile(source);
    const replacements = {
      lang,
      header: passwordReset[lang].header,
      user: user.username,
      text: passwordReset[lang].text,
      resetPasswordUrl: `${resetPasswordLink}?token=${token}`,
      resetPasswordUrlTitle: passwordReset[lang].link,
      footer: passwordReset[lang].footer,
    };
    const htmlTemplateToSend = template(replacements);

    await sendEmail(email, passwordReset[lang].subject, htmlTemplateToSend);

    return {
      status: 'success',
      message: 'email sent',
    };
  } catch (error: unknown) {
    logger.error(error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new InternalServerError('Failed to process forgot password request', error);
  }
}

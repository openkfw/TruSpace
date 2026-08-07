import fs from 'fs';
import path from 'path';

import { compile } from 'handlebars';
import jwt from 'jsonwebtoken';

import { activateUserDb, findUserByTokenDb, updateUserToken } from '../../../shared/clients/db';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { sendEmail } from '../../../shared/mailing/mailing';
import { registrationConfirmation } from '../../../shared/mailing/mailingConstants';
import { HttpError, InternalServerError } from '../../../shared/errors';
import { CONFIRMATION_EMAIL_EXPIRATION } from '../../../shared/utility/constants';
import { TokenExpiredError } from '../errors/token-expired.error';
import { TokenInvalidError } from '../errors/token-invalid.error';
import { UserNotFoundError } from '../errors/user-not-found.error';

export async function postUsersConfirmRegistration(token: string, lang: string, confirmationLink: string) {
  try {
    jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
    const user = await findUserByTokenDb(token);

    if (!user) {
      throw new TokenInvalidError();
    }

    const activatedUsers = await activateUserDb(user.id);
    const updatedUsers = await updateUserToken(user.id, '');

    if (!activatedUsers || !updatedUsers) {
      throw new UserNotFoundError(`id: ${user.id}`);
    }

    return {
      status: 'success',
      message: 'User activated successfully',
    };
  } catch (error: unknown) {
    logger.error(error);

    if (error instanceof jwt.TokenExpiredError) {
      try {
        const user = await findUserByTokenDb(token);

        if (!user) {
          throw new TokenInvalidError();
        }

        const newToken = jwt.sign({ email: user.email }, Buffer.from(config.jwt.secret), {
          expiresIn: CONFIRMATION_EMAIL_EXPIRATION,
        });

        const updatedUsers = await updateUserToken(user.id, newToken);

        if (!updatedUsers) {
          throw new UserNotFoundError(`id: ${user.id}`);
        }

        const filePath = path.join(process.cwd(), 'src/shared/mailing/templates/registrationConfirmation.html');
        const source = fs.readFileSync(filePath, 'utf-8');
        const template = compile(source);
        const replacements = {
          lang,
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

        // Signal to the client that a fresh link is already on its way,
        // so the UI can tell the user to check their inbox instead of
        // showing a bare "something went wrong" error.
        throw new TokenExpiredError({ emailResent: true });
      } catch (err) {
        logger.error(err);
        if (err instanceof HttpError) {
          throw err;
        }
        throw new InternalServerError('Failed to resend confirmation email', err);
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenInvalidError();
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new InternalServerError('Failed to confirm user registration', error);
  }
}

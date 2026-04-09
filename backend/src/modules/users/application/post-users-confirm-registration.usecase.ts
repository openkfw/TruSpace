import fs from 'fs';
import path from 'path';

import { compile } from 'handlebars';
import jwt from 'jsonwebtoken';

import { activateUserDb, findUserByTokenDb, updateUserToken } from '../../../shared/clients/db';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { sendEmail } from '../../../shared/mailing/mailing';
import { registrationConfirmation } from '../../../shared/mailing/mailingConstants';
import { UseCaseResponse } from '../../../shared/types/usecase';
import { CONFIRMATION_EMAIL_EXPIRATION } from '../../../shared/utility/constants';

export async function postUsersConfirmRegistration(
  token: string,
  lang: string,
  confirmationLink: string,
): Promise<UseCaseResponse> {
  try {
    jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
    const user = await findUserByTokenDb(token);

    if (user) {
      await activateUserDb(user.id);
      await updateUserToken(user.id, '');

      return {
        body: {
          status: 'success',
          message: 'User activated successfully',
        },
      };
    }

    return {
      statusCode: 400,
      body: {
        status: 'failure',
        message: 'Invalid token',
      },
    };
  } catch (error: any) {
    logger.error(error);

    if (error.message === 'jwt expired') {
      try {
        const user = await findUserByTokenDb(token);

        if (user) {
          const newToken = jwt.sign({ email: user.email }, Buffer.from(config.jwt.secret), {
            expiresIn: CONFIRMATION_EMAIL_EXPIRATION,
          });

          await updateUserToken(user.id, newToken);

          const filePath = path.join(process.cwd(), 'src/mailing/templates/registrationConfirmation.html');
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

          return {
            statusCode: 400,
            body: {
              status: 'error',
              message: 'expired token',
            },
          };
        }

        return {
          statusCode: 500,
          body: {
            status: 'failure',
            message: 'Unknown error occurred',
          },
        };
      } catch (err) {
        logger.error(err);
        return {
          statusCode: 500,
          body: {
            status: 'failure',
            message: 'Unknown error occurred',
          },
        };
      }
    }

    if (error.message === 'invalid signature') {
      return {
        statusCode: 400,
        body: {
          status: 'error',
          message: 'invalid token',
        },
      };
    }

    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Unknown error occurred',
      },
    };
  }
}

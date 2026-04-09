import jwt from 'jsonwebtoken';

import { updateUserPassword } from '../../../shared/clients/db';
import { getTokenDb, removeTokensOfUserDb } from '../../../shared/clients/db/resetPasswordTokens';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { hashPassword } from '../../../shared/encryption';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function postUsersResetPassword(password: string, token: string): Promise<UseCaseResponse> {
  try {
    jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
    const result = await getTokenDb(token);

    if (!result) {
      logger.error('invalid token');
      return {
        statusCode: 400,
        body: {
          status: 'error',
          message: 'invalid token',
        },
      };
    }

    const passwordHash = await hashPassword(password);
    await updateUserPassword(result.user_id, passwordHash);
    await removeTokensOfUserDb(result.user_id);

    return {
      body: {
        status: 'success',
        message: 'password set',
      },
    };
  } catch (error: any) {
    logger.error(error);

    if (error.message === 'jwt expired' || error.message === 'invalid signature') {
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

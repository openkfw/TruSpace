import jwt from 'jsonwebtoken';

import { updateUserPassword } from '../../../shared/clients/db';
import { getTokenDb, removeTokensOfUserDb } from '../../../shared/clients/db/resetPasswordTokens';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { hashPassword } from '../../../shared/encryption';
import { BadRequestError, HttpError, InternalServerError } from '../../../shared/errors';
import { UserNotFoundError } from '../errors/user-not-found.error';

export async function postUsersResetPassword(password: string, token: string) {
  try {
    jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;
    const result = await getTokenDb(token);

    if (!result) {
      logger.error('invalid token');
      throw new BadRequestError('Invalid token');
    }

    const passwordHash = await hashPassword(password);
    const updatedUsers = await updateUserPassword(result.user_id, passwordHash);

    if (!updatedUsers) {
      throw new UserNotFoundError(`id: ${result.user_id}`);
    }

    await removeTokensOfUserDb(result.user_id);

    return {
      status: 'success',
      message: 'password set',
    };
  } catch (error: unknown) {
    logger.error(error);

    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      throw new BadRequestError('Invalid token', error);
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new InternalServerError('Failed to reset password', error);
  }
}

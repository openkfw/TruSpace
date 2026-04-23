import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

import { findUserByEmailDb, updateUserFirstSignIn } from '../../../shared/clients/db/users';
import { verifyPassword } from '../../../shared/encryption';
import { USER_STATUS } from '../../../shared/utility/constants';
import logger from '../../../shared/config/winston';
import { JwtPayload } from '../../../shared/types/interfaces';
import { config } from '../../../shared/config/config';
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

export async function postUsersLogin(req: Request, res: Response) {
  // can't use validate middleware here, need to return status: "failure"
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    return res.status(400).send({
      status: 'failure',
      message: 'Invalid request',
      errors: validation.array(),
    });
  }

  try {
    const { email, password } = req.body;

    const user = await findUserByEmailDb(email);

    const isValid = user ? await verifyPassword(password, user.password_hash) : false;

    if (!user || !isValid) {
      return res.status(401).json({
        status: 'failure',
        message: 'Invalid credentials',
      });
    }

    const isActive = user.status === USER_STATUS.active;

    if (!isActive) {
      return res.status(401).json({
        status: 'failure',
        message: 'Account inactive',
      });
    }

    const nodeId = await resolveNodeId();
    const payload: JwtPayload = {
      name: user.username,
      email: user.email,
      uiid: user.uiid,
      nodeId,
      firstSignIn: user.first_sign_in === 'true',
    };

    const token = jwt.sign(payload, Buffer.from(config.jwt.secret), {
      expiresIn: config.jwt.expiration,
    });

    const decodedToken = jwt.verify(token, Buffer.from(config.jwt.secret)) as jwt.JwtPayload;

    if (user.first_sign_in === 'true') {
      await updateUserFirstSignIn(user.id, 'false');
    }

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: config.jwt.expiration * 1000,
      path: '/',
    });

    if (user.uiid && nodeId) {
      try {
        const userData = await usersIpfsRepository.getUserData(nodeId, user.uiid);
        if (userData?.userName && userData.userName !== 'UNKNOWN') {
          logger.info('User data exists in IPFS');
        } else {
          logger.warn('User data is missing or invalid in IPFS, creating new user data');
          await usersIpfsRepository.createUserData({
            nodeId,
            userId: user.uiid,
            userName: user.username,
          });
          logger.info('User data created in IPFS');
        }
      } catch (error) {
        logger.error('Error fetching/creating user data in IPFS:', error);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful',
      user: {
        name: user.username,
        email: user.email,
        uiid: user.uiid,
        nodeId,
        firstSignIn: user.first_sign_in === 'true',
        expires: decodedToken.exp,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'failure',
      message: 'Authentication error',
    });
  }
}

import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmailDb } from '../clients/db';
import { config } from '../config/config';
import logger from '../config/winston';
import { AuthenticatedRequest } from '../types';
import { JwtPayload } from '../types/interfaces';
import { healthIpfsRepository } from '../../modules/health/infrastructure/health-ipfs.repository';
import { USER_STATUS } from '../utility/constants';

export async function authenticateCookie(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.auth_token;

  if (!token) {
    logger.warn('Missing auth_token authentication cookie', {
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({
      status: 'failure',
      message: 'Authentication required',
      requestId: req.requestId,
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if (!decoded.nodeId) {
      try {
        const clusterId = await healthIpfsRepository.clusterId();
        decoded.nodeId = clusterId?.ipfs?.id || '';
      } catch (error) {
        logger.error('Error resolving nodeId:', error);
      }
    }

    req.user = decoded;

    if (config.env === 'production') {
      const user = await findUserByEmailDb(req.user.email);
      if (!user || user.status !== USER_STATUS.active) {
        return res.status(401).json({
          status: 'failure',
          message: 'Account inactive',
          requestId: req.requestId,
        });
      }
    }

    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });
    return res.status(401).json({
      status: 'failure',
      message: 'Invalid or expired token',
      requestId: req.requestId,
    });
  }
}

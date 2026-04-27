import { NextFunction, Request, Response } from 'express';
import logger from '../config/winston';
import { HttpError, InternalServerError } from '../errors';

export function catchAllErrorsMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    logger.warn(`Request failed: ${err.status} ${err.code} - ${err.message}`, err.details);
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
    });
  }

  logger.error(`Unhandled error`, err);
  const unhandledError = new InternalServerError();
  return res.status(unhandledError.status).json({
    error: unhandledError.code,
    message: unhandledError.message,
  });
}

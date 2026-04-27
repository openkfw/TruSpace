import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.path}`));
}

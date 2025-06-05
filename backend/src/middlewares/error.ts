import { NextFunction, Request, Response } from "express";
import logger from "../config/winston";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  logger.error(err);

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  const statusCode =
    res.statusCode === 200 ||
    res.statusCode === 400 ||
    res.statusCode === 401 ||
    res.statusCode === 404
      ? res.statusCode
      : 500;

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
  });
}

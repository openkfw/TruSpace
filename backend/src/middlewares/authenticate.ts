import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { findUserByEmailDb } from "../clients/db";
import { config } from "../config/config";
import logger from "../config/winston";
import { AuthenticatedRequest } from "../types";
import { JwtPayload } from "../types/interfaces";
import { USER_STATUS } from "../utility/constants";

export async function authenticateCookie(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.auth_token;

  if (!token) {
    logger.error(`${req.url} Missing auth_token authentication cookie`);
    return res.status(401).json({
      status: "failure",
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;

    if (config.env === "production") {
      const user = await findUserByEmailDb(req.user.email);
      if (!user || user.status !== USER_STATUS.active) {
        return res.status(401).json({
          status: "failure",
          message: "Account inactive",
        });
      }
    }

    next();
  } catch (error) {
    logger.error(error);
    return res.status(401).json({
      status: "failure",
      message: "Invalid or expired token",
    });
  }
}

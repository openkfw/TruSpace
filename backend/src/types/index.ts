import { Request } from "express";
import { JwtPayload } from "./interfaces";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

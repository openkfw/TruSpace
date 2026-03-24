import { Request } from "express";
import { JwtPayload } from "./interfaces";
import "./express";
import "./lusca";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

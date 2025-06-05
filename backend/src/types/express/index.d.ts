import { JwtPayload } from "../interfaces";

declare namespace Express {
  interface Request {
    user?: JwtPayload;
  }
}

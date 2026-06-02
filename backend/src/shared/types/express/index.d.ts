import { JwtPayload } from "../interfaces";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      csrfToken?: () => string;
      requestId?: string;
      parentRequestId?: string;
    }
  }
}

export {};

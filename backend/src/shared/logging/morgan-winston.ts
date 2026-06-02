import { Request } from "express";
import morgan from "morgan";

import logger from "../config/winston";

const sanitizePath = (path: string | undefined): string | undefined => {
  return path?.split("?")[0];
};

export const morganWinstonMiddleware = morgan(
  (tokens, req, res) => {
    const request = req as Request;

    return JSON.stringify({
      requestId: request.requestId,
      method: tokens.method(req, res),
      path: sanitizePath(
        request.originalUrl || tokens.url(req, res) || undefined,
      ),
      statusCode: Number(tokens.status(req, res) || 0),
      durationMs: Number(tokens["response-time"](req, res) || 0),
      contentLength: Number(tokens.res(req, res, "content-length") || 0),
      ip: tokens["remote-addr"](req, res),
      userAgent: tokens.req(req, res, "user-agent"),
    });
  },
  {
    stream: {
      write: (message: string) => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
          return;
        }

        try {
          logger.http("http_request_completed", JSON.parse(trimmedMessage));
        } catch (error) {
          logger.warn("http_request_log_parse_failed", {
            rawMessage: trimmedMessage,
            error,
          });
        }
      },
    },
  },
);

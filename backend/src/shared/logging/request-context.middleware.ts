import { randomUUID } from "node:crypto";

import { NextFunction, Request, Response } from "express";

import { runWithRequestContext } from "./request-context";

const REQUEST_ID_HEADER = "x-request-id";
const PARENT_REQUEST_ID_HEADER = "x-parent-request-id";

const sanitizePath = (path: string): string => {
  return path.split("?")[0];
};

const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId =
    getHeaderValue(req.headers[REQUEST_ID_HEADER])?.trim() || randomUUID();
  const parentRequestId = getHeaderValue(
    req.headers[PARENT_REQUEST_ID_HEADER],
  )?.trim();

  req.requestId = requestId;
  req.parentRequestId = parentRequestId;

  res.setHeader("X-Request-ID", requestId);

  if (parentRequestId) {
    res.setHeader("X-Parent-Request-ID", parentRequestId);
  }

  runWithRequestContext(
    {
      requestId,
      parentRequestId,
      requestMethod: req.method,
      requestPath: sanitizePath(req.originalUrl || req.url),
    },
    () => next(),
  );
};

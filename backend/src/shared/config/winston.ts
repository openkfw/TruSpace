import { createLogger, format, Logger, transports } from "winston";

import { getRequestContext } from "../logging/request-context";

const SPLAT = Symbol.for("splat");

const normalizeLogLevel = (value: string | undefined): string => {
  const normalizedValue = value?.toLowerCase() || "debug";

  if (normalizedValue === "warning") {
    return "warn";
  }

  if (normalizedValue === "trace") {
    return "silly";
  }

  return normalizedValue;
};

const enrichWithRequestContext = format((info) => {
  const requestContext = getRequestContext();

  if (!requestContext) {
    return info;
  }

  for (const [key, value] of Object.entries(requestContext)) {
    if (value !== undefined && info[key] === undefined) {
      info[key] = value;
    }
  }

  return info;
});

const serializeError = (value: unknown): Record<string, unknown> | unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const serializeMeta = (
  info: Record<string | symbol, unknown>,
): Record<string, unknown> | undefined => {
  const ignoredKeys = new Set([
    "level",
    "message",
    "stack",
    "timestamp",
    "service",
  ]);

  const metaEntries = Object.entries(info)
    .filter(([key, value]) => !ignoredKeys.has(key) && value !== undefined)
    .map(([key, value]) => [key, serializeError(value)]);

  const meta = Object.fromEntries(metaEntries);
  const splatValues = info[SPLAT];

  if (Array.isArray(splatValues)) {
    const extras: unknown[] = [];

    for (const value of splatValues) {
      if (value === undefined) {
        continue;
      }

      if (value instanceof Error) {
        if (meta.error === undefined) {
          meta.error = serializeError(value);
        } else {
          extras.push(serializeError(value));
        }
        continue;
      }

      if (isRecord(value)) {
        for (const [key, recordValue] of Object.entries(value)) {
          if (meta[key] === undefined && recordValue !== undefined) {
            meta[key] = serializeError(recordValue);
          }
        }
        continue;
      }

      extras.push(serializeError(value));
    }

    if (extras.length > 0) {
      meta.extra = extras;
    }
  }

  if (Object.keys(meta).length === 0) {
    return undefined;
  }

  return meta;
};

const logger: Logger = createLogger({
  level: normalizeLogLevel(process.env.LOG_LEVEL),
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    enrichWithRequestContext(),
    format.colorize(),
    format.printf((info) => {
      const { level, message, stack, timestamp, service } = info;
      const meta = serializeMeta(info as Record<string | symbol, unknown>);
      const serializedMeta = meta ? ` ${JSON.stringify(meta)}` : "";

      return stack
        ? `${timestamp} [${level}] ${service}: ${message}${serializedMeta}\n${stack}`
        : `${timestamp} [${level}] ${service}: ${message}${serializedMeta}`;
    }),
  ),
  defaultMeta: { service: "Truspace-api" },
  transports: [new transports.Console()],
});

export default logger;

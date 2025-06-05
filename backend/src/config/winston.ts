import { createLogger, format, Logger, transports } from "winston";

const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.colorize(),
    format.splat(),

    format.simple(),
    format.printf(({ level, message, stack, timestamp }) => {
      return stack
        ? `${timestamp} [${level}]: ${message}\n${stack}`
        : `${timestamp} [${level}]: ${message}`;
    })
  ),
  defaultMeta: { service: "Truspace-api" },
  transports: [new transports.Console()],
});

export default logger;

import { envVarsSchema } from "./envVarsSchema";
import logger from "./winston";

interface Config {
  env: string;
  port: number;
  ipfsPinningServiceHost: string;
  ipfsClusterHost: string;
  ipfsGatewayHost: string;
  ollama: {
    model: string;
  };
  openWebUI: {
    email: string;
    password: string;
    secretKey: string;
    host: string;
    autodownload: boolean;
  };
  databasePath: string;
  disableAllAIFunctionality: boolean;
  jwt: {
    secret: string;
    expiration: number;
  };
  masterPassword: string;
  corsOrigin: string[];
  contentSecurityPolicy: {
    defaultSrc: string[];
    imgSrc: string[];
    frameSrc: string[];
    scriptSrc: string[];
    workerSrc: string[];
  };
  rateLimitPerMinute: number;
  registerUsersAsInactive: boolean;
  smtpServer: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  emailSender: string;
}

const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config: Config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  ipfsPinningServiceHost: envVars.IPFS_PINSVC_HOST,
  ipfsClusterHost: envVars.IPFS_CLUSTER_HOST,
  ipfsGatewayHost: envVars.IPFS_GATEWAY_HOST,
  ollama: {
    model: envVars.OLLAMA_MODEL,
  },
  openWebUI: {
    email: envVars.ADMIN_USER_EMAIL,
    password: envVars.ADMIN_USER_PASSWORD,
    secretKey: envVars.WEBUI_SECRET_KEY,
    host: envVars.OPENWEBUI_HOST,
    autodownload: envVars.AUTO_DOWNLOAD,
  },
  databasePath: envVars.DATABASE_PATH,
  disableAllAIFunctionality: envVars.DISABLE_ALL_AI_FUNCTIONALITY,
  jwt: {
    secret: envVars.JWT_SECRET,
    expiration: envVars.JWT_MAX_AGE,
  },
  masterPassword: envVars.MASTER_PASSWORD,
  corsOrigin: envVars.CORS_ORIGIN ? envVars.CORS_ORIGIN.split(",") : [],
  contentSecurityPolicy: {
    defaultSrc: envVars.CONTENT_SECURITY_POLICY_DEFAULT_URLS
      ? envVars.CONTENT_SECURITY_POLICY_DEFAULT_URLS.split(",")
      : [],
    imgSrc: envVars.CONTENT_SECURITY_POLICY_IMG_URLS
      ? envVars.CONTENT_SECURITY_POLICY_IMG_URLS.split(",")
      : [],
    frameSrc: envVars.CONTENT_SECURITY_POLICY_FRAME_URLS
      ? envVars.CONTENT_SECURITY_POLICY_FRAME_URLS.split(",")
      : [],
    scriptSrc: envVars.CONTENT_SECURITY_POLICY_SCRIPT_URLS
      ? envVars.CONTENT_SECURITY_POLICY_SCRIPT_URLS.split(",")
      : [],
    workerSrc: envVars.CONTENT_SECURITY_POLICY_WORKER_URLS
      ? envVars.CONTENT_SECURITY_POLICY_WORKER_URLS.split(",")
      : [],
  },
  rateLimitPerMinute: envVars.RATE_LIMIT_PER_MINUTE
    ? parseInt(envVars.RATE_LIMIT_PER_MINUTE, 10)
    : 200,
  registerUsersAsInactive: envVars.REGISTER_USERS_AS_INACTIVE === "true",
  smtpServer: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    secure: envVars.SMTP_SSL,
    user: envVars.SMTP_USER,
    password: envVars.SMTP_PASSWORD,
  },
  emailSender: envVars.EMAIL_SENDER,
};

if (config.jwt.secret === "super-secret-key") {
  logger.warn(
    "JWT_SECRET defaults to 'super-secret-key'. We strongly urge you to set your own JWT_SECRET!"
  );
}

if (config.masterPassword === "Kennwort123") {
  logger.warn(
    "MASTER_PASSWORD defaults to 'Kennwort123'. We strongly urge you to set your own MASTER_PASSWORD!"
  );
}

if (config.env === "development") {
  logger.debug(`config:\n${JSON.stringify(config, null, 2)}`);
} else {
  logger.debug(`config:\n${sanitizeConfig(config)}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeConfig(config: Config): any {
  const sensitiveKeys = [
    "password",
    "secret",
    "secretKey",
    "masterPassword",
    "jwt",
  ];

  return JSON.stringify(
    config,
    (key, value) => {
      if (
        typeof key === "string" &&
        sensitiveKeys.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )
      ) {
        return typeof value === "string" ? "********" : value;
      }

      if (key === "openWebUI" && typeof value === "object") {
        const sanitizedWebUI = { ...value };
        if (sanitizedWebUI.password) sanitizedWebUI.password = "********";
        if (sanitizedWebUI.secretKey) sanitizedWebUI.secretKey = "********";
        return sanitizedWebUI;
      }

      if (key === "jwt" && typeof value === "object") {
        const sanitizedJwt = { ...value };
        if (sanitizedJwt.secret) sanitizedJwt.secret = "********";
        return sanitizedJwt;
      }

      return value;
    },
    2
  );
}

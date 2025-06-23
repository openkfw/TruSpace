import Joi from "joi";

export const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(8000),
  IPFS_PINSVC_HOST: Joi.string().default("http://localhost:9097"),
  IPFS_CLUSTER_HOST: Joi.string().default("http://localhost:9094"),
  IPFS_GATEWAY_HOST: Joi.string().default("http://localhost:8080"),
  OLLAMA_MODEL: Joi.string()
    .allow("")
    .optional()
    .empty("")
    .default("llama3.2:latest"),
  WEBUI_SECRET_KEY: Joi.string()
    .allow("")
    .optional()
    .empty("")
    .default("t0p-s3cr3t"),
  OPENWEBUI_HOST: Joi.string().default("http://localhost:3333"),
  ADMIN_USER_EMAIL: Joi.string().default("admin@admin.com"),
  ADMIN_USER_PASSWORD: Joi.string().default("admin"),
  AUTO_DOWNLOAD: Joi.bool().optional().allow("").empty("").default(true),
  DISABLE_ALL_AI_FUNCTIONALITY: Joi.bool()
    .optional()
    .allow("")
    .empty("")
    .default(false),
  DATABASE_PATH: Joi.string()
    .optional()
    .allow("")
    .empty("")
    .default("../volumes/db/truspace.db"),
  JWT_SECRET: Joi.string()
    .optional()
    .allow("")
    .empty("")
    .default("super-secret-key"),
  JWT_MAX_AGE: Joi.number()
    .optional()
    .allow("")
    .empty("")
    .default(24 * 60 * 60)
    .note("Token validity in seconds"),
  CORS_ORIGIN: Joi.string()
    .optional()
    .allow("")
    .empty("")
    .default("http://localhost:3000"),
  CONTAINER: Joi.boolean()
    .optional()
    .allow("")
    .empty("")
    .default(false)
    .note("Automatically set to `true` in Dockerfile"),
  MASTER_PASSWORD: Joi.string()
    .allow("")
    .empty("")
    .default("Kennwort123")
    .note("Maybe force admin to set MASTER_PASSWORD before booting up?"),
  SMTP_HOST: Joi.string().allow("").empty("").default("host.docker.internal"),
  SMTP_PORT: Joi.number()
    .optional()
    .allow("")
    .empty("")
    .default(1025)
    .note("Token validity in seconds"),
  SMTP_SSL: Joi.boolean().optional().allow("").empty("").default(false),
  SMTP_USER: Joi.string().allow("").empty("").default(""),
  SMTP_PASSWORD: Joi.string().allow("").empty("").default(""),
  emailSender: Joi.string().allow("").empty("").default("TruSpace <truspace@truspace.com>"),
})
  .unknown()
  .required();

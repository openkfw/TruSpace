import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fileUpload from "express-fileupload";
import session from "express-session";
import rateLimit from "express-rate-limit";
import fs from "fs";
import helmet from "helmet";
import lusca from "lusca";
import createError from "http-errors";
import yaml from "js-yaml";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/config";
import { authenticateCookie } from "./middlewares/authenticate";
import { errorHandler } from "./middlewares/error";
import chatsRouter from "./routes/chats";
import documentsRouter from "./routes/documents";
import healthRouter from "./routes/health";
import languageRouter from "./routes/language";
import perspectivesRouter from "./routes/perspectives";
import promptsRouter from "./routes/prompts";
import tagsRouter from "./routes/tags";
import permissionsRouter from "./routes/userPermissions";
import usersRouter from "./routes/users";
import workspacesRouter from "./routes/workspaces";

const app = express();
const { env, contentSecurityPolicy, rateLimitPerMinute } = config;

app.use(morgan("dev"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", ...contentSecurityPolicy.defaultSrc],
        imgSrc: [
          "'self'",
          "*",
          "data:",
          "blob:",
          ...contentSecurityPolicy.imgSrc,
        ],
        frameSrc: ["'self'", ...contentSecurityPolicy.frameSrc],
        scriptSrc: ["'self'", "blob:", ...contentSecurityPolicy.scriptSrc],
        workerSrc: ["'self'", "blob:", ...contentSecurityPolicy.workerSrc],
      },
    },
  })
);

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: rateLimitPerMinute || 200, // limit each IP to 200 requests per windowMs
});
app.use(limiter);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        config.corsOrigin.indexOf(origin) !== -1 ||
        config.corsOrigin.length === 0
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── SESSION + CSRF PROTECTION ──────────────────────────────────────────────
app.use(
  session({
    secret: process.env.JWT_SECRET || "dev-secret", // fallback for development
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: Number(process.env.JWT_MAX_AGE || 86400) * 1000, // match JWT lifetime
    },
  })
);

const csrfProtection = lusca.csrf();

// FOR NOW: pragmatic solution to exclude auth routes from CSRF protection, since they don't have a session yet
// FUTURE: consider implementing a more robust solution, e.g. using separate CSRF tokens for auth routes or rethinking the auth flow to establish a session earlier
// For this, we could build a dedicated csrf endpoint /api/csrf-token that generates a CSRF token and sets the cookie, which clients can call before accessing protected routes. This way, we can keep all routes protected by CSRF while still allowing auth routes to function properly.
app.use((req, res, next) => {
  const isPublicAuthRoute =
    req.path === "/api/users/login" ||
    req.path === "/api/users/register" ||
    req.path === "/api/users/forgot-password" ||
    req.path === "/api/users/reset-password" ||
    req.path === "/api/users/confirm-registration";

  if (isPublicAuthRoute) {
    return next();
  }

  return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  if (req.csrfToken) {
    const token = req.csrfToken();
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
  next();
});
// ───────────────────────────────────────────────────────────────────────────

// todo filesize should be configurable
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 109 * 1024 * 1024, // ±100 MB   limit
    },
    abortOnLimit: true,
  })
);

/** ROUTES */
app.use("/api/workspaces", authenticateCookie, workspacesRouter);
app.use("/api/documents", authenticateCookie, documentsRouter);
app.use("/api/chats", authenticateCookie, chatsRouter);
app.use("/api/perspectives", authenticateCookie, perspectivesRouter);
app.use("/api/tags", authenticateCookie, tagsRouter);
app.use("/api/health", authenticateCookie, healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/language", authenticateCookie, languageRouter);
app.use("/api/permissions", authenticateCookie, permissionsRouter);
app.use("/api/prompts", authenticateCookie, promptsRouter);

// OpenAPI docs
const pathToOpenapi =
  env === "production"
    ? path.join(process.cwd(), "dist", "openapi", "openapi.yaml")
    : path.join(process.cwd(), "openapi", "openapi.yaml");

const doc = yaml.load(
  fs.readFileSync(pathToOpenapi, "utf8")
) as swaggerUi.JsonObject;
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(doc));

app.use(function (req, res, next) {
  res.status(404);
  next(createError(404));
});

// catch-all error handler
app.use(errorHandler);

export default app;

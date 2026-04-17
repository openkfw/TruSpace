import 'express-async-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import lusca from 'lusca';
import morgan from 'morgan';

import { config } from './shared/config/config';
import { catchAllErrorsMiddleware } from './shared/middlewares/catch-all-errors.middleware';
import { router } from './routes';
import { notFoundMiddleware } from './shared/middlewares/not-found.middleware';

const { contentSecurityPolicy, rateLimitPerMinute } = config;

const app = express();
app.set('trust proxy', 1); // trust first proxy (e.g. if behind a load balancer) for correct client IP and secure cookie handling

app.use(morgan('dev'));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", ...contentSecurityPolicy.defaultSrc],
        imgSrc: ["'self'", '*', 'data:', 'blob:', ...contentSecurityPolicy.imgSrc],
        frameSrc: ["'self'", ...contentSecurityPolicy.frameSrc],
        scriptSrc: ["'self'", 'blob:', ...contentSecurityPolicy.scriptSrc],
        workerSrc: ["'self'", 'blob:', ...contentSecurityPolicy.workerSrc],
      },
    },
  }),
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

      if (config.corsOrigin.indexOf(origin) !== -1 || config.corsOrigin.length === 0) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── SESSION + CSRF PROTECTION ──────────────────────────────────────────────
app.use(
  session({
    secret: process.env.JWT_SECRET || 'dev-secret', // fallback for development
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: Number(process.env.JWT_MAX_AGE || 86400) * 1000, // match JWT lifetime
    },
  }),
);

const csrfProtection = lusca.csrf();

// FOR NOW: pragmatic solution to exclude auth routes from CSRF protection, since they don't have a session yet
// FUTURE: consider implementing a more robust solution, e.g. using separate CSRF tokens for auth routes or rethinking the auth flow to establish a session earlier
// For this, we could build a dedicated csrf endpoint /api/csrf-token that generates a CSRF token and sets the cookie, which clients can call before accessing protected routes. This way, we can keep all routes protected by CSRF while still allowing auth routes to function properly.
app.use((req, res, next) => {
  const isPublicAuthRoute =
    req.path === '/api/users/login' ||
    req.path === '/api/users/register' ||
    req.path === '/api/users/forgot-password' ||
    req.path === '/api/users/reset-password' ||
    req.path === '/api/users/confirm-registration';

  if (isPublicAuthRoute) {
    return next();
  }

  return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  if (req.csrfToken) {
    const token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
  }),
);

/** ROUTES */
app.use('/api', router);
// catch 404 and forward to error handler
app.use(notFoundMiddleware);
// catch-all errors handler
app.use(catchAllErrorsMiddleware);

export default app;

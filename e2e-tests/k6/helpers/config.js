import { fail } from "k6";

const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  apiBaseUrl: normalizeBaseUrl(
    __ENV.K6_API_BASE_URL || __ENV.API_URL || "http://localhost:8000/api",
  ),
  email: __ENV.K6_EMAIL || "",
  password: __ENV.K6_PASSWORD || "",
  workspaceId: __ENV.K6_WORKSPACE_ID || "",
  docId: __ENV.K6_DOC_ID || "",
  cid: __ENV.K6_CID || "",
  thinkTimeMs: parseNumber(__ENV.THINK_TIME_MS, 250),
  documentLimit: parseNumber(__ENV.K6_DOCUMENT_LIMIT, 10),
  uploadFilename: __ENV.K6_UPLOAD_FILENAME || "sample-upload.txt",
};

export const numberFromEnv = (name, fallback) => {
  return parseNumber(__ENV[name], fallback);
};

export const durationFromEnv = (name, fallback) => {
  return __ENV[name] || fallback;
};

export const apiUrl = (path) => {
  return `${config.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const sleepSeconds = () => {
  return config.thinkTimeMs / 1000;
};

export const ensureAuthConfig = () => {
  if (!config.email || !config.password) {
    fail(
      "Missing K6_EMAIL or K6_PASSWORD. Set them before running the TruSpace k6 tests.",
    );
  }
};

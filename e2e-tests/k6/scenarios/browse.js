import { check, group, sleep } from "k6";

import { get, parseJson } from "../helpers/api.js";
import {
  durationFromEnv,
  numberFromEnv,
  sleepSeconds,
} from "../helpers/config.js";
import { getDocumentContext, getWorkspaceId } from "../helpers/discovery.js";
import { getSession } from "../helpers/session.js";

export const options = {
  vus: numberFromEnv("K6_VUS", 5),
  duration: durationFromEnv("K6_DURATION", "5m"),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:GET /workspaces}": ["p(95)<1000"],
    "http_req_duration{name:GET /documents}": ["p(95)<1500"],
    "http_req_duration{name:GET /documents/detail}": ["p(95)<1500"],
    "http_req_duration{name:GET /chats/:docId}": ["p(95)<1500"],
  },
};

export default function () {
  const session = getSession();
  const workspaceId = getWorkspaceId();
  const documentContext = getDocumentContext();

  group("browse workspaces", () => {
    const response = get("/workspaces", "GET /workspaces");

    check(response, {
      "workspaces returned 200": (res) => res.status === 200,
    });

    const payload = parseJson(response, "workspaces");
    check(payload, {
      "workspaces payload is array": (value) => Array.isArray(value),
      "workspaces payload not empty": (value) =>
        Array.isArray(value) && value.length > 0,
    });
  });

  group("browse documents", () => {
    const response = get(
      `/documents?workspace=${encodeURIComponent(workspaceId)}&from=0&limit=10`,
      "GET /documents",
    );

    check(response, {
      "documents returned 200": (res) => res.status === 200,
    });

    const payload = parseJson(response, "documents");
    check(payload, {
      "documents payload has data": (value) => Array.isArray(value.data),
    });
  });

  group("browse document detail", () => {
    const response = get(
      `/documents/detail/${encodeURIComponent(documentContext.docId)}`,
      "GET /documents/detail",
    );

    check(response, {
      "detail returned 200": (res) => res.status === 200,
    });
  });

  group("browse document chats", () => {
    const response = get(
      `/chats/${encodeURIComponent(documentContext.docId)}`,
      "GET /chats/:docId",
    );

    check(response, {
      "chats returned 200": (res) => res.status === 200,
    });

    const payload = parseJson(response, "document chats");
    check(payload, {
      "chats payload is array": (value) => Array.isArray(value),
    });
  });

  if (!session.csrfToken) {
    throw new Error("Missing CSRF token in browse session.");
  }

  sleep(sleepSeconds());
}

import { check, group, sleep } from "k6";

import { get, parseJson } from "../helpers/api.js";
import {
  durationFromEnv,
  numberFromEnv,
  sleepSeconds,
} from "../helpers/config.js";
import {
  fetchDocumentsByWorkspace,
  getDocumentContext,
  getWorkspaceId,
} from "../helpers/discovery.js";
import { getSession } from "../helpers/session.js";

export const options = {
  vus: numberFromEnv("K6_VUS", 1),
  iterations: numberFromEnv("K6_ITERATIONS", 1),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:POST /users/login}": ["p(95)<1500"],
    "http_req_duration{name:GET /workspaces}": ["p(95)<1000"],
    "http_req_duration{name:GET /documents}": ["p(95)<1500"],
    "http_req_duration{name:GET /documents/detail}": ["p(95)<1500"],
    "http_req_duration{name:GET /documents/version}": ["p(95)<3000"],
    "http_req_duration{name:GET /chats/:docId}": ["p(95)<1500"],
  },
  setupTimeout: durationFromEnv("K6_SETUP_TIMEOUT", "30s"),
};

export default function () {
  group("session bootstrap", () => {
    getSession();
  });

  group("workspace and documents", () => {
    const workspaceId = getWorkspaceId();
    const documents = fetchDocumentsByWorkspace(workspaceId);

    check(documents, {
      "documents payload has array": (payload) => Array.isArray(payload.data),
    });
  });

  const documentContext = getDocumentContext();

  group("document detail", () => {
    const detailResponse = get(
      `/documents/detail/${encodeURIComponent(documentContext.docId)}`,
      "GET /documents/detail",
    );

    check(detailResponse, {
      "detail returned 200": (response) => response.status === 200,
    });

    const payload = parseJson(detailResponse, "document detail");
    check(payload, {
      "detail has docId": (response) => response.docId === documentContext.docId,
    });
  });

  group("document download", () => {
    const versionResponse = get(
      `/documents/version/${encodeURIComponent(documentContext.cid)}`,
      "GET /documents/version",
    );

    check(versionResponse, {
      "download returned 200": (response) => response.status === 200,
      "download returned bytes": (response) =>
        (response.body || "").length > 0,
    });
  });

  group("document chats", () => {
    const chatsResponse = get(
      `/chats/${encodeURIComponent(documentContext.docId)}`,
      "GET /chats/:docId",
    );

    check(chatsResponse, {
      "chats returned 200": (response) => response.status === 200,
    });

    const payload = parseJson(chatsResponse, "document chats");
    check(payload, {
      "chats payload is array": (response) => Array.isArray(response),
    });
  });

  sleep(sleepSeconds());
}

import { check, group, sleep } from "k6";

import { get, parseJson, postJson } from "../helpers/api.js";
import {
  durationFromEnv,
  numberFromEnv,
  sleepSeconds,
} from "../helpers/config.js";
import { getDocumentContext } from "../helpers/discovery.js";
import { getSession, getWriteHeaders } from "../helpers/session.js";

export const options = {
  scenarios: {
    chat_writes: {
      executor: "shared-iterations",
      vus: numberFromEnv("K6_VUS", 2),
      iterations: numberFromEnv("K6_ITERATIONS", 20),
      maxDuration: durationFromEnv("K6_MAX_DURATION", "2m"),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:POST /chats}": ["p(95)<2000"],
    "http_req_duration{name:GET /chats/:docId}": ["p(95)<1500"],
  },
};

export default function () {
  getSession();
  const documentContext = getDocumentContext();

  group("post chat message", () => {
    const response = postJson(
      "/chats",
      "POST /chats",
      {
        cid: documentContext.cid,
        docId: documentContext.docId,
        workspaceOrigin: documentContext.workspaceId,
        data: `k6 chat message vu=${__VU} iter=${__ITER} ts=${Date.now()}`,
      },
      {
        headers: getWriteHeaders(),
      },
    );

    check(response, {
      "chat write returned 200": (res) => res.status === 200,
    });
  });

  group("read chats after write", () => {
    const response = get(
      `/chats/${encodeURIComponent(documentContext.docId)}`,
      "GET /chats/:docId",
    );

    check(response, {
      "chat read returned 200": (res) => res.status === 200,
    });

    const payload = parseJson(response, "chat read");
    check(payload, {
      "chat read payload is array": (value) => Array.isArray(value),
    });
  });

  sleep(sleepSeconds());
}

import http from "k6/http";
import { check, group, sleep } from "k6";

import { parseJson, postForm } from "../helpers/api.js";
import {
  config,
  durationFromEnv,
  numberFromEnv,
  sleepSeconds,
} from "../helpers/config.js";
import {
  getWorkspaceId,
} from "../helpers/discovery.js";
import { getSession, getWriteHeaders } from "../helpers/session.js";

const uploadFixture = open(`../fixtures/${config.uploadFilename}`, "b");

export const options = {
  scenarios: {
    document_uploads: {
      executor: "shared-iterations",
      vus: numberFromEnv("K6_VUS", 1),
      iterations: numberFromEnv("K6_ITERATIONS", 3),
      maxDuration: durationFromEnv("K6_MAX_DURATION", "5m"),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:POST /documents}": ["p(95)<5000"],
  },
};

export default function () {
  getSession();
  const workspaceId = getWorkspaceId();

  group("upload document", () => {
    const response = postForm(
      "/documents",
      "POST /documents",
      {
        workspace: workspaceId,
        file: http.file(
          uploadFixture,
          config.uploadFilename,
          "text/plain",
        ),
      },
      {
        headers: getWriteHeaders(),
      },
    );

    check(response, {
      "upload returned 200": (res) => res.status === 200,
    });

    const payload = parseJson(response, "upload response");
    check(payload, {
      "upload response marked success": (value) => value.success === true,
    });
  });

  sleep(sleepSeconds());
}

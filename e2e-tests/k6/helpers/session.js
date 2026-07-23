import { check, fail } from "k6";

import { get, parseJson, postJson } from "./api.js";
import { ensureAuthConfig } from "./config.js";

let cachedSession;

const getCookieValue = (response, cookieName) => {
  const cookies = response.cookies[cookieName];
  return cookies && cookies.length > 0 ? cookies[0].value : "";
};

export const getSession = () => {
  if (cachedSession) {
    return cachedSession;
  }

  ensureAuthConfig();

  const loginResponse = postJson(
    "/users/login",
    "POST /users/login",
    {
      email: __ENV.K6_EMAIL,
      password: __ENV.K6_PASSWORD,
    },
  );

  const loginSucceeded = check(loginResponse, {
    "login returned 200": (response) => response.status === 200,
  });

  if (!loginSucceeded) {
    fail(
      `Login failed with status ${loginResponse.status}. Check credentials and API base URL.`,
    );
  }

  const loginPayload = parseJson(loginResponse, "login response");
  if (loginPayload.status !== "success") {
    fail(`Login did not succeed: ${JSON.stringify(loginPayload)}`);
  }

  const workspacesResponse = get("/workspaces", "GET /workspaces");
  const workspaceFetchSucceeded = check(workspacesResponse, {
    "workspaces bootstrap returned 200": (response) => response.status === 200,
  });

  if (!workspaceFetchSucceeded) {
    fail(
      `Workspace bootstrap failed with status ${workspacesResponse.status}.`,
    );
  }

  const csrfToken = getCookieValue(workspacesResponse, "XSRF-TOKEN");
  if (!csrfToken) {
    fail(
      "CSRF bootstrap failed. Expected an XSRF-TOKEN cookie after GET /workspaces.",
    );
  }

  cachedSession = {
    csrfToken,
    workspaces: parseJson(workspacesResponse, "workspaces bootstrap"),
  };

  return cachedSession;
};

export const getWriteHeaders = () => {
  const session = getSession();
  return {
    "X-CSRF-Token": session.csrfToken,
  };
};

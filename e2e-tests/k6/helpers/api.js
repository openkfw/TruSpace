import http from "k6/http";
import { fail } from "k6";

import { apiUrl } from "./config.js";

const mergeHeaders = (defaults, custom) => {
  return {
    ...(defaults || {}),
    ...(custom || {}),
  };
};

const withRequestName = (name, params = {}, defaultHeaders = {}) => {
  return {
    ...params,
    headers: mergeHeaders(defaultHeaders, params.headers),
    tags: {
      ...(params.tags || {}),
      name,
    },
  };
};

export const get = (path, name, params = {}) => {
  return http.get(apiUrl(path), withRequestName(name, params));
};

export const postJson = (path, name, payload, params = {}) => {
  return http.post(
    apiUrl(path),
    JSON.stringify(payload),
    withRequestName(name, params, {
      "Content-Type": "application/json",
    }),
  );
};

export const postForm = (path, name, payload, params = {}) => {
  return http.post(apiUrl(path), payload, withRequestName(name, params));
};

export const parseJson = (response, label) => {
  try {
    return response.json();
  } catch (error) {
    fail(`Expected JSON response for ${label}, but parsing failed: ${error}`);
  }
};

import { check, fail } from "k6";

import { config } from "./config.js";
import { get, parseJson } from "./api.js";
import { getSession } from "./session.js";

let cachedWorkspaceId;
let cachedDocumentContext;

const selectWorkspaceIdFromList = (workspaces) => {
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    fail(
      "No workspaces available for the logged-in user. Seed test data or set K6_WORKSPACE_ID explicitly.",
    );
  }

  const workspace = workspaces[0];
  const workspaceId = workspace.uuid || workspace.meta?.workspace_uuid;

  if (!workspaceId) {
    fail(
      `Could not determine workspace ID from workspace payload: ${JSON.stringify(workspace)}`,
    );
  }

  return workspaceId;
};

export const getWorkspaceId = () => {
  if (cachedWorkspaceId) {
    return cachedWorkspaceId;
  }

  if (config.workspaceId) {
    cachedWorkspaceId = config.workspaceId;
    return cachedWorkspaceId;
  }

  const session = getSession();
  cachedWorkspaceId = selectWorkspaceIdFromList(session.workspaces);
  return cachedWorkspaceId;
};

export const fetchDocumentsByWorkspace = (workspaceId = getWorkspaceId()) => {
  const response = get(
    `/documents?workspace=${encodeURIComponent(workspaceId)}&from=0&limit=${config.documentLimit}`,
    "GET /documents",
  );

  const succeeded = check(response, {
    "documents list returned 200": (res) => res.status === 200,
  });

  if (!succeeded) {
    fail(
      `Fetching documents failed with status ${response.status} for workspace ${workspaceId}.`,
    );
  }

  return parseJson(response, "documents list");
};

export const getDocumentContext = () => {
  if (cachedDocumentContext) {
    return cachedDocumentContext;
  }

  const workspaceId = getWorkspaceId();
  const documentsPayload = fetchDocumentsByWorkspace(workspaceId);
  const documents = Array.isArray(documentsPayload.data)
    ? documentsPayload.data
    : [];

  let document =
    documents.find((entry) => entry.docId === config.docId) || documents[0];

  if (config.docId && !document) {
    document = { docId: config.docId };
  }

  if (!document) {
    fail(
      "No documents available in the selected workspace. Seed a document or set K6_DOC_ID/K6_CID explicitly.",
    );
  }

  const docId = config.docId || document.docId;
  if (!docId) {
    fail(`Could not determine docId from payload: ${JSON.stringify(document)}`);
  }

  const detailResponse = get(
    `/documents/detail/${encodeURIComponent(docId)}`,
    "GET /documents/detail",
  );

  const detailSucceeded = check(detailResponse, {
    "document detail returned 200": (response) => response.status === 200,
  });

  if (!detailSucceeded) {
    fail(
      `Fetching document detail failed with status ${detailResponse.status} for docId ${docId}.`,
    );
  }

  const detail = parseJson(detailResponse, "document detail");
  const cid =
    config.cid ||
    detail.cid ||
    (Array.isArray(detail.documentVersions) &&
    detail.documentVersions.length > 0
      ? detail.documentVersions[0].cid
      : "");

  if (!cid) {
    fail(
      `Could not determine CID from document detail. Set K6_CID explicitly. Payload: ${JSON.stringify(detail)}`,
    );
  }

  cachedDocumentContext = {
    workspaceId,
    docId,
    cid,
  };

  return cachedDocumentContext;
};

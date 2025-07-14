import { v4 as uuidv4 } from "uuid";
import { DocumentRequest } from "../../src/types/interfaces";
import { getWorkspacePasswordDb } from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { config } from "../config/config";
import logger from "../config/winston";
import { decrypt } from "../encryption";

export function decodeFilename(filename: string) {
  return Buffer.from(filename, "latin1").toString("utf-8");
}

export function createDocumentRequest({
  filename,
  docId,
  creator,
  creatorUiid,
  workspaceOrigin,
  version,
  size,
  mimetype,
  versionTagName,
}: {
  filename: string;
  docId?: string;
  creator: string;
  creatorUiid: string;
  workspaceOrigin: string;
  version?: string;
  size?: number;
  mimetype?: string;
  versionTagName?: string;
}): DocumentRequest {
  const docRequest: DocumentRequest = {
    docId: docId || uuidv4(),
    meta: {
      filename,
      timestamp: Date.now().toString(),
      version: version || "1",
      size: size || 0,
      creator,
      creatorUiid,
      workspaceOrigin,
      encrypted: "true",
      mimetype,
      versionTagName
    },
  };
  return docRequest;
}

export async function getWorkspacePassword(workspaceId: string) {
  const encryptedWorkspacePassword = await getWorkspacePasswordDb(workspaceId);
  if (!encryptedWorkspacePassword?.encrypted_password) {
    // TODO what if wID doesn't work?
    logger.warn(`Missing encryption password. Trying workspaceId ...`);
    return workspaceId;
  }

  const workspacePassword = await decrypt(
    encryptedWorkspacePassword?.encrypted_password,
    config.masterPassword
  );

  return workspacePassword.toString();
}

export async function getContributorsDocument(docId: string) {
  const contributors: string[] = [];
  const client = new IpfsClient();

  const [docs, chats, tags, perspectives] = await Promise.all([
    client.getDocumentsByDocumentId(docId),
    client.getMessagesByDocumentId(docId),
    client.getTagsByDocumentId(docId),
    client.getPerspectivesByDocumentId(docId),
  ]);

  docs.map((d) => contributors.push(d.meta.creatorUiid));
  chats.map((d) => contributors.push(d.meta.creatorUiid));
  tags
    .filter((d) => d.meta.creatorType === "user")
    .map((d) => contributors.push(d.meta.creatorUiid));
  perspectives
    .filter((d) => d.meta.creatorType === "user")
    .map((d) => contributors.push(d.meta.creatorUiid));

  const uniqueContributors = [...new Set(contributors.filter((c) => c))];
  return { count: uniqueContributors.length, contributors: uniqueContributors };
}

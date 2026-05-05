import { v4 as uuidv4 } from 'uuid';
import { DocumentRequest } from '../types/interfaces';
import { getWorkspacePasswordDb } from '../clients/db';
import { config } from '../config/config';
import logger from '../config/winston';
import { decrypt } from '../encryption';
import { chatsIpfsRepository } from '../../modules/chats/infrastructure/chats-ipfs.repository';
import { documentsIpfsRepository } from '../../modules/documents/infrastructure/documents-ipfs.repository';
import { perspectivesIpfsRepository } from '../../modules/perspectives/infrastructure/perspectives-ipfs.repository';
import { tagsIpfsRepository } from '../../modules/tags/infrastructure/tags-ipfs.repository';

export function decodeFilename(filename: string) {
  return Buffer.from(filename, 'latin1').toString('utf-8');
}

export function createDocumentRequest({
  filename,
  docId,
  creatorNodeId,
  creatorUserId,
  workspaceOrigin,
  version,
  size,
  mimetype,
  versionTagName,
  malwareScanStatus,
  malwareScanProvider,
  malwareScanTimestamp,
}: {
  filename: string;
  docId?: string;
  creatorNodeId: string;
  creatorUserId: string;
  workspaceOrigin: string;
  version?: string;
  size?: number;
  mimetype?: string;
  versionTagName?: string;
  malwareScanStatus?: string;
  malwareScanProvider?: string;
  malwareScanTimestamp?: string;
}): DocumentRequest {
  const docRequest: DocumentRequest = {
    docId: docId || uuidv4(),
    meta: {
      filename,
      timestamp: Date.now().toString(),
      version: version || '1',
      size: size || 0,
      creatorNodeId,
      creatorUserId,
      workspaceOrigin,
      encrypted: 'true',
      mimetype,
      versionTagName,
    },
  };

  if (malwareScanStatus) {
    docRequest.meta.malwareScanStatus = malwareScanStatus;
  }

  if (malwareScanProvider) {
    docRequest.meta.malwareScanProvider = malwareScanProvider;
  }

  if (malwareScanTimestamp) {
    docRequest.meta.malwareScanTimestamp = malwareScanTimestamp;
  }

  return docRequest;
}

export async function getWorkspacePassword(workspaceId: string) {
  const encryptedWorkspacePassword = await getWorkspacePasswordDb(workspaceId);
  if (!encryptedWorkspacePassword?.encrypted_password) {
    // TODO what if wID doesn't work?
    logger.warn(`Missing encryption password. Trying workspaceId ...`);
    return workspaceId;
  }

  const workspacePassword = await decrypt(encryptedWorkspacePassword?.encrypted_password, config.masterPassword);

  return workspacePassword.toString();
}

export async function getContributorsDocument(docId: string) {
  const contributors: string[] = [];

  const [docs, chats, tags, perspectives] = await Promise.all([
    documentsIpfsRepository.getDocumentsByDocumentId(docId),
    chatsIpfsRepository.getMessagesByDocumentId(docId),
    tagsIpfsRepository.getTagsByDocumentId(docId),
    perspectivesIpfsRepository.getPerspectivesByDocumentId(docId),
  ]);

  docs.map((d) => contributors.push(d.meta.creatorUserId));
  chats.map((d) => contributors.push(d.meta.creatorUserId));
  tags.filter((d) => d.meta.creatorType === 'user').map((d) => contributors.push(d.meta.creatorUserId));
  perspectives.filter((d) => d.meta.creatorType === 'user').map((d) => contributors.push(d.meta.creatorUserId));

  const uniqueContributors = [...new Set(contributors.filter((c) => c))];
  return { count: uniqueContributors.length, contributors: uniqueContributors };
}

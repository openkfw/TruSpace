import { Response } from 'express';

import { Document } from '../../../shared/types/interfaces/truspace';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { chatsIpfsRepository } from '../../chats/infrastructure/chats-ipfs.repository';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function getDocumentsStatsByDocumentId(documentId: string, email: string, res: Response) {
  const [chats, document] = await Promise.all([
    chatsIpfsRepository.getMessagesByDocumentId(documentId),
    documentsIpfsRepository.getDocumentDetailsById(documentId),
  ]);

  const documentDetails = document.documentVersions;
  const documentVersions = documentDetails.reduce((acc: string[], version: Document) => {
    if (!acc.includes(version.meta.creatorUserId)) {
      acc.push(version.meta.creatorUserId);
    }
    return acc;
  }, []);

  await checkPermissionForWorkspace(email, res, document.meta.workspaceOrigin);

  return {
    chatsLength: chats.length,
    uniqueContributorsLength: documentVersions.length,
  };
}

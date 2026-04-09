import { Response } from 'express';

import { Document } from '../../../shared/types/interfaces/truspace';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';

export async function getDocumentsStatsByDocumentId(documentId: string, email: string, res: Response) {
  const client = new IpfsClient();

  const [chats, document] = await Promise.all([
    client.getMessagesByDocumentId(documentId),
    client.getDocumentDetailsById(documentId),
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

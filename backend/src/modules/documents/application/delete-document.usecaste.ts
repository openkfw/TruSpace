import { Response } from 'express';

import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function deleteDocument(documentId: string, email: string, res: Response) {
  const doc = await documentsIpfsRepository.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, doc.meta.workspaceOrigin);

  const result = await documentsIpfsRepository.deleteDocument(documentId);
  return { result };
}

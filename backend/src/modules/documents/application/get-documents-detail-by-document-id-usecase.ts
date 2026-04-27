import { Response } from 'express';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function getDocumentsDetailByDocumentId(documentId: string, email: string, res: Response) {
  const documents = await documentsIpfsRepository.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, documents.meta.workspaceOrigin);

  return documents;
}

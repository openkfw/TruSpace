import { Response } from 'express';

import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { deleteDocumentsAndAssociatedItems } from './delete-documents-and-associated-items.usecase';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function deleteDocument(documentId: string, email: string, res: Response) {
  const doc = await documentsIpfsRepository.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, doc.meta.workspaceOrigin);

  const items = await documentsIpfsRepository.getEverythingByDocId(documentId);
  const result = await deleteDocumentsAndAssociatedItems(items);
  return { result };
}

import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { recordEvent } from '../../events/application/record-event.usecase';
import { deleteDocumentsAndAssociatedItems } from './delete-documents-and-associated-items.usecase';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function deleteDocument(
  documentId: string,
  email: string,
  res: Response,
  user?: AuthenticatedRequest['user'],
) {
  const doc = await documentsIpfsRepository.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, doc.meta.workspaceOrigin);

  const items = await documentsIpfsRepository.getEverythingByDocId(documentId);
  const result = await deleteDocumentsAndAssociatedItems(items);

  await recordEvent({
    eventType: 'document',
    eventAction: 'delete',
    objectId: documentId,
    objectName: doc.meta.filename,
    workspaceOrigin: doc.meta.workspaceOrigin,
    docId: documentId,
    actorType: 'user',
    actorNodeId: user?.nodeId,
    actorUserId: user?.uiid,
  });

  return { result };
}

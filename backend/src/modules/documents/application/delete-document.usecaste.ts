import { Response } from 'express';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';

export async function deleteDocument(documentId: string, email: string, res: Response) {
  const client = new IpfsClient();

  const doc = await client.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, doc.meta.workspaceOrigin);

  const result = await client.deleteDocument(documentId);
  return { result };
}

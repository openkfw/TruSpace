import { Response } from 'express';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';

export async function getDocumentsDetailByDocumentId(documentId: string, email: string, res: Response) {
  const client = new IpfsClient();
  const documents = await client.getDocumentDetailsById(documentId);
  await checkPermissionForWorkspace(email, res, documents.meta.workspaceOrigin);

  return documents;
}

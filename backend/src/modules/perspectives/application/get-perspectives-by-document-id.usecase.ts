import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getPerspectivesByDocumentId(documentId: string) {
  return new IpfsClient().getPerspectivesByDocumentId(documentId);
}

import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getTagsByDocumentId(documentId: string) {
  return new IpfsClient().getTagsByDocumentId(documentId);
}

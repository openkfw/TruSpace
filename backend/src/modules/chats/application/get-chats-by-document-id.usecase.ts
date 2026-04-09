import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getChatsByDocumentId(documentId: string) {
  const client = new IpfsClient();
  return await client.getMessagesByDocumentId(documentId);
}

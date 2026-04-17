import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { FileNotFoundError } from '../errors/file-not-found.error';

export async function getLanguageByDocumentId(documentId: string) {
  const ipfsClient = new IpfsClient();
  const result = await ipfsClient.getDocumentVersionDetailsByCid(documentId);

  if (!result || 'error' in result) {
    throw new FileNotFoundError(documentId, result?.error);
  }

  return result.meta.language;
}

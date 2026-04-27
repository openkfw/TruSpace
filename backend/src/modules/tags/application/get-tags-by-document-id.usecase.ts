import { tagsIpfsRepository } from '../infrastructure/tags-ipfs.repository';

export async function getTagsByDocumentId(documentId: string) {
  return tagsIpfsRepository.getTagsByDocumentId(documentId);
}

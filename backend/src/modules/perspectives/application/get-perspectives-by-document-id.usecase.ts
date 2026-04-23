import { perspectivesIpfsRepository } from '../infrastructure/perspectives-ipfs.repository';

export async function getPerspectivesByDocumentId(documentId: string) {
  return perspectivesIpfsRepository.getPerspectivesByDocumentId(documentId);
}

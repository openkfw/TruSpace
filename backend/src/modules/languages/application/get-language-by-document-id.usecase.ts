import { languagesIpfsRepository } from '../infrastructure/languages-ipfs.repository';

export async function getLanguageByDocumentId(documentId: string) {
  return languagesIpfsRepository.getLanguageByVersionCid(documentId);
}

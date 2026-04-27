import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function getDocumentsStatistics() {
  const { data: documents, count } = await documentsIpfsRepository.getAllDocuments();
  const recentlyAddedDocuments = documents.filter(
    (doc) => Number(doc.meta.timestamp) > Date.now() - 10 * 24 * 60 * 60 * 1000,
  );
  return {
    totalDocuments: count,
    recentlyAddedDocuments: recentlyAddedDocuments.length,
  };
}

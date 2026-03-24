import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getDocumentsStatistics() {
  const client = new IpfsClient();
  const { data: documents, count } = await client.getAllDocuments();
  const recentlyAddedDocuments = documents.filter(
    (doc) => Number(doc.meta.timestamp) > Date.now() - 10 * 24 * 60 * 60 * 1000,
  );
  return {
    totalDocuments: count,
    recentlyAddedDocuments: recentlyAddedDocuments.length,
  };
}

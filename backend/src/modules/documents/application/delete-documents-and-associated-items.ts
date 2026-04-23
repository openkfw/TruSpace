import { deleteMultipleJobStatusesDb } from '../../../shared/clients/db';
import { GeneralTemplateOfItemInWorkspace } from '../../../shared/types/interfaces/truspace';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function deleteDocumentsAndAssociatedItems(allItems: GeneralTemplateOfItemInWorkspace[]) {
  const allItemCids = allItems.map((item) => item.cid);

  const allDocuments = allItems.filter((item) => item.meta.type === 'document');
  const allDocumentCids = allDocuments.map((document) => document.cid);

  const requestIds: string[] = [];
  allDocumentCids.forEach((documentCid) => {
    requestIds.push(`req_tags_${documentCid}`);
    requestIds.push(`req_perspectives_${documentCid}`);
  });

  if (allItemCids.length) {
    await documentsIpfsRepository.deletePins(allItemCids);
  }

  await deleteMultipleJobStatusesDb(requestIds);
}

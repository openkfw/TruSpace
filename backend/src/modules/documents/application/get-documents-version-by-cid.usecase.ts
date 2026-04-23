import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/types';
import { documentsIpfsRepository } from '../infrastructure/documents-ipfs.repository';

export async function getDocumentsVersionByCID(cid: string, req: AuthenticatedRequest, res: Response) {
  return documentsIpfsRepository.downloadDocumentVersionByCid(req, res, cid);
}

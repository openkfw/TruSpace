import { Response } from 'express';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { AuthenticatedRequest } from '../../../shared/types';

export async function getDocumentsVersionByCID(cid: string, req: AuthenticatedRequest, res: Response) {
  return new IpfsClient().downloadDocumentVersionByCid(req, res, cid);
}

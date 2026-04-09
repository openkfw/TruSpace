import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getPerspectivesByVersionCid(cid: string) {
  return new IpfsClient().getPerspectivesByVersionCid(cid);
}

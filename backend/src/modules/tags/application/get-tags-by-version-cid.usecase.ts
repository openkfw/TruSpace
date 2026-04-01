import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getTagsByVersionCid(cid: string) {
  return new IpfsClient().getTagsByVersionCid(cid);
}

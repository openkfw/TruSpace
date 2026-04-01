import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getAllPerspectives() {
  return new IpfsClient().getAllPerspectives();
}

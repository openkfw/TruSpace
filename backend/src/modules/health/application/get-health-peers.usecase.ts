import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getHealthPeers() {
  const peers = await new IpfsClient().getPeers();
  return peers;
}

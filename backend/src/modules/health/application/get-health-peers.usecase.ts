import { healthIpfsRepository } from '../infrastructure/health-ipfs.repository';

export async function getHealthPeers() {
  const peers = await healthIpfsRepository.getPeers();
  return peers;
}

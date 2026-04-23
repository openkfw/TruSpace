import { perspectivesIpfsRepository } from '../infrastructure/perspectives-ipfs.repository';

export async function getPerspectivesByVersionCid(cid: string) {
  return perspectivesIpfsRepository.getPerspectivesByVersionCid(cid);
}

import { perspectivesIpfsRepository } from '../infrastructure/perspectives-ipfs.repository';

export async function getAllPerspectives() {
  return perspectivesIpfsRepository.getAllPerspectives();
}

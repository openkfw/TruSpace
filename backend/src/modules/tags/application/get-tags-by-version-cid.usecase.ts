import { tagsIpfsRepository } from '../infrastructure/tags-ipfs.repository';

export async function getTagsByVersionCid(cid: string) {
  return tagsIpfsRepository.getTagsByVersionCid(cid);
}

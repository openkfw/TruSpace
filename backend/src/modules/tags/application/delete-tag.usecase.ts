import { tagsIpfsRepository } from '../infrastructure/tags-ipfs.repository';

export async function deleteTag(tagId: string) {
  const result = await tagsIpfsRepository.deleteTag(tagId);
  return { result };
}

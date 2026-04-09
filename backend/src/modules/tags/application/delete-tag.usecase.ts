import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function deleteTag(tagId: string) {
  const result = await new IpfsClient().deleteTag(tagId);
  return { result };
}

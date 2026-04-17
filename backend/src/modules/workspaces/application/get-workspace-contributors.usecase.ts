import { IpfsClient } from '../../../shared/clients/ipfs-client';

export async function getWorkspaceContributors(wId: string) {
  const client = new IpfsClient();
  const everythingInWorkspace = await client.getEverythingInWorkspace(wId);
  const contributors = everythingInWorkspace
    .filter((t) => t.meta.creatorType !== 'ai')
    .map((t) => t.meta.creatorUserId);

  const uniqueContributors = [...new Set(contributors.filter((c) => c))];

  return { count: uniqueContributors.length, contributors: uniqueContributors };
}

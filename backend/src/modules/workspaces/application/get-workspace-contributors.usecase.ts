import { workspacesIpfsRepository } from '../infrastructure/workspaces-ipfs.repository';

export async function getWorkspaceContributors(wId: string) {
  const everythingInWorkspace = await workspacesIpfsRepository.getEverythingInWorkspace(wId);
  const contributors = everythingInWorkspace
    .filter((t) => t.meta.creatorType !== 'ai')
    .map((t) => t.meta.creatorUserId);

  const uniqueContributors = [...new Set(contributors.filter((c) => c))];

  return { count: uniqueContributors.length, contributors: uniqueContributors };
}

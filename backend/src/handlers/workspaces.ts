import { IpfsClient } from "../clients/ipfs-client";

export async function getContributorsWorkspace(wId: string) {
  const client = new IpfsClient();
  const everythingInWorkspace = await client.getEverythingInWorkspace(wId);
  const contributors = everythingInWorkspace
    .filter((t) => t.meta.creatorType !== "ai")
    .map((t) => t.meta.creatorUiid);

  const uniqueContributors = [...new Set(contributors.filter((c) => c))];

  return { count: uniqueContributors.length, contributors: uniqueContributors };
}

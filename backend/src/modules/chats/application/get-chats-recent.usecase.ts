import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';

export async function getRecentChats(email: string) {
  const client = new IpfsClient();
  const allWorkspaces = await client.getAllWorkspaces();
  const allowedWs = (await findPermissionsByEmail(email)).map((p) => p.workspaceId);
  const allAllowedWs = allWorkspaces.filter((ws) => allowedWs.includes(ws.uuid) || ws.meta.is_public);
  const result = await client.getAllMessages();
  const filteredMessages = result
    .filter((message) => {
      const workspaceOrigin = message.meta.workspaceOrigin;
      return allAllowedWs.some((ws) => ws.uuid === workspaceOrigin);
    })
    .sort((a, b) => {
      return Number(b.meta.timestamp) - Number(a.meta.timestamp);
    });
  // return only the most recent 10 messages
  return filteredMessages.splice(0, 10);
}

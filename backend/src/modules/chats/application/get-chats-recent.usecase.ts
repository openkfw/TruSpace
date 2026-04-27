import { findPermissionsByEmail } from '../../../shared/handlers/userPermissions';
import { workspacesIpfsRepository } from '../../workspaces/infrastructure/workspaces-ipfs.repository';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function getRecentChats(email: string) {
  const allWorkspaces = await workspacesIpfsRepository.getAllWorkspaces();
  const allowedWs = (await findPermissionsByEmail(email)).map((p) => p.workspaceId);
  const allAllowedWs = allWorkspaces.filter((ws) => allowedWs.includes(ws.uuid) || ws.meta.is_public);
  const result = await chatsIpfsRepository.getAllMessages();
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

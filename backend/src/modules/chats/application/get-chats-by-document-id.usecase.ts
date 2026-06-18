import { ChatMessage } from '../../../shared/types/interfaces/truspace';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function getChatsByDocumentId(
  documentId: string,
  currentUser?: { uiid?: string; nodeId?: string },
): Promise<ChatMessage[]> {
  const messages = await chatsIpfsRepository.getMessagesByDocumentId(documentId);

  if (!currentUser?.uiid || !currentUser?.nodeId) {
    return messages;
  }

  return messages.map((message) => ({
    ...message,
    isOwnMessage:
      message.meta.creatorUserId === currentUser.uiid &&
      message.meta.creatorNodeId === currentUser.nodeId,
  }));
}

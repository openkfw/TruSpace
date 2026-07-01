import { ChatLike, ChatMessage } from '../../../shared/types/interfaces/truspace';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function getChatsByDocumentId(
  documentId: string,
  currentUser?: { uiid?: string; nodeId?: string },
): Promise<ChatMessage[]> {
  const messages = await chatsIpfsRepository.getMessagesByDocumentId(documentId);

  // Fetch likes for every message in the document with a single allocations
  // scan, then group them client-side by `chatId`. This is cheaper than
  // hitting the cluster once per message.
  const chatIds = messages
    .map((m) => m.meta.chatId)
    .filter((id): id is string => Boolean(id));
  const allLikes = await chatsIpfsRepository.getLikesForChatIds(chatIds);
  const likesByChatId = allLikes.reduce<Record<string, ChatLike[]>>((acc, like) => {
    const id = like.meta.chatId;
    if (!id) return acc;
    if (!acc[id]) acc[id] = [];
    acc[id].push(like);
    return acc;
  }, {});

  return messages.map((message) => {
    const chatId = message.meta.chatId;
    const likes = (chatId && likesByChatId[chatId]) || [];
    const isOwnMessage =
      Boolean(currentUser?.uiid && currentUser?.nodeId) &&
      message.meta.creatorUserId === currentUser?.uiid &&
      message.meta.creatorNodeId === currentUser?.nodeId;
    const isLikedByCurrentUser =
      Boolean(currentUser?.uiid && currentUser?.nodeId) &&
      likes.some(
        (like) =>
          like.meta.creatorUserId === currentUser?.uiid &&
          like.meta.creatorNodeId === currentUser?.nodeId,
      );
    return {
      ...message,
      isOwnMessage,
      likes,
      isLikedByCurrentUser,
    };
  });
}

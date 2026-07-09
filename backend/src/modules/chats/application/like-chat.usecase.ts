import { ChatLikeRequest } from '../../../shared/types/interfaces/truspace';
import { ChatNotFoundError } from '../errors/chat-not-found.error';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

/**
 * Add a "thumbs up" like from the current user to a chat message. Idempotent:
 * if the user has already liked the message, the existing like is returned
 * unchanged instead of creating a duplicate pin.
 *
 * Likes live in their own `chatLike` pins keyed by the message's stable
 * `chatId`, so this operation does not touch (or rewrite) the chat pin
 * itself.
 */
export async function likeChat(
  chatId: string,
  user: { uiid?: string; nodeId?: string },
): Promise<{ cid: string }> {
  if (!user?.uiid || !user?.nodeId) {
    throw new Error('Unauthenticated');
  }

  const chat = await chatsIpfsRepository.getMessageByChatId(chatId);
  if (!chat) {
    throw new ChatNotFoundError(chatId);
  }

  const existing = await chatsIpfsRepository.findUserLikeForChat(
    chatId,
    user.uiid,
    user.nodeId,
  );
  if (existing) {
    return { cid: existing.cid };
  }

  const likeReq: ChatLikeRequest = {
    meta: {
      type: 'chatLike',
      chatId,
      timestamp: Date.now().toString(),
      creatorNodeId: user.nodeId,
      creatorUserId: user.uiid,
    },
  };

  const cid = await chatsIpfsRepository.createLike(likeReq);
  return { cid };
}

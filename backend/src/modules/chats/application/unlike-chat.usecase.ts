import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

/**
 * Remove the current user's like (if any) from a chat message. Idempotent:
 * unliking a chat that the user hasn't liked is a no-op.
 */
export async function unlikeChat(
  chatId: string,
  user: { uiid?: string; nodeId?: string },
): Promise<{ removed: boolean }> {
  if (!user?.uiid || !user?.nodeId) {
    throw new Error('Unauthenticated');
  }

  const existing = await chatsIpfsRepository.findUserLikeForChat(
    chatId,
    user.uiid,
    user.nodeId,
  );
  if (!existing) {
    return { removed: false };
  }

  await chatsIpfsRepository.deleteLike(existing.cid);
  return { removed: true };
}

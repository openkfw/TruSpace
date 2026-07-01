import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';
import { ChatNotFoundError } from '../errors/chat-not-found.error';
import { ChatEditForbiddenError } from '../errors/edit-forbidden.error';


/**
 * Edit the textual content of a chat message. Only the original author is
 * allowed to perform the edit; ownership is verified against the IPFS-stored
 * `creatorUserId` / `creatorNodeId` rather than trusting the client.
 *
 * The chat's original `timestamp` is preserved so the message keeps its slot
 * in the chronological timeline. An `editedTimestamp` is added to the pin
 * metadata so the UI can render an "Edited" hint with the edit time.
 *
 * Returns the new cid of the updated chat message pin. Because IPFS content
 * is immutable, the existing pin is replaced rather than mutated in place.
 */
export async function editChat(
  cid: string,
  data: string,
  currentUser: { uiid?: string; nodeId?: string },
): Promise<{ cid: string }> {
  if (!currentUser?.uiid || !currentUser?.nodeId) {
    throw new ChatEditForbiddenError();
  }

  const existing = await chatsIpfsRepository.getMessageByCid(cid);
  if (!existing) {
    throw new ChatNotFoundError(cid);
  }

  const isAuthor =
    existing.meta.creatorUserId === currentUser.uiid &&
    existing.meta.creatorNodeId === currentUser.nodeId;
  if (!isAuthor) {
    throw new ChatEditForbiddenError();
  }

  const newCid = await chatsIpfsRepository.updateMessage(cid, data);
  return { cid: newCid };
}

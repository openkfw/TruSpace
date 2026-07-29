
import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToChatLike, transformPinToChatMessage } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { ChatMessageRequest } from '../../../shared/types/interfaces';
import { ChatLike, ChatLikeRequest, ChatMessage } from '../../../shared/types/interfaces/truspace';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;
  let result: AllocationPin[] = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch(_e) { console.log(_e);return null; } })
      .filter(Boolean);
  } else if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.allocations)) {
    result = data.allocations;
  }
  if (primaryFilter) {
    result = result.filter((a) =>
      a.metadata && a.metadata[primaryFilter.key] === primaryFilter.value);
  }
  return result;
}

class ChatsIpfsRepository {
  async createMessage(message: ChatMessageRequest): Promise<string> {
    try {
      const messageMeta = { ...message.meta };
      delete messageMeta.creatorName;
      const form = createJsonFormData({ ...message, meta: messageMeta });
      const metadataQuery = buildMetadataQuery(messageMeta);
      const clusterResp = await clusterClient.post('/add?stream-channels=false' + metadataQuery, form, {
        headers: { ...form.getHeaders() },
      });
      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessageByCid(cid: string): Promise<ChatMessage | null> {
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chat' });
      const match = allocations.find((a) => a.cid === cid);
      if (!match) return null;
      const [enriched] = await this.#enrichAndSortMessages([match]);
      return enriched ?? null;
    } catch (error) {
      logger.error('Error getting chat message ' + cid + ':', error);
      throw error;
    }
  }

  /**
   * Look up a chat message by its stable `chatId`. Falls back to treating
   * `chatId` as a pin cid for legacy chats that were created before the
   * `chatId` field existed (those use their cid as id).
   */
  async getMessageByChatId(chatId: string): Promise<ChatMessage | null> {
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chat' });
      const match =
        allocations.find((a) => a.metadata?.chatId === chatId) ??
        allocations.find((a) => a.cid === chatId);
      if (!match) return null;
      const [enriched] = await this.#enrichAndSortMessages([match]);
      return enriched ?? null;
    } catch (error) {
      logger.error('Error getting chat message by chatId ' + chatId + ':', error);
      throw error;
    }
  }

  /**
   * Replace an existing chat message pin with a new one carrying updated
   * `data` and an `editedTimestamp`. Because IPFS content is immutable, we
   * create a fresh pin (which produces a new cid) and unpin the old one. All
   * other metadata - including the original `timestamp` and `chatId` - is
   * preserved so the message stays in its original position in the timeline
   * and likes (which reference `chatId`) continue to apply.
   */
  async updateMessage(originalCid: string, updatedData: string): Promise<string> {
    const existing = await this.getMessageByCid(originalCid);
    if (!existing) {
      throw new Error('Chat message not found: ' + originalCid);
    }
    const updatedReq: ChatMessageRequest = {
      meta: {
        ...existing.meta,
        data: updatedData,
        editedTimestamp: Date.now().toString(),
      },
    };
    const newCid = await this.createMessage(updatedReq);
    try {
      await clusterClient.delete('/pins/' + encodeURIComponent(originalCid));
    } catch (error) {
      logger.error('Error unpinning old chat message ' + originalCid + ':', error);
      // Best-effort cleanup; the new pin already exists.
    }
    return newCid;
  }

  async getMessagesByDocumentId(docId: string): Promise<ChatMessage[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chat' });
      const filtered = allocations.filter((a) => a.metadata?.docId === docId);
      logger.info('[chats.getMessagesByDocumentId] fetch=' + (Date.now() - t0) + 'ms, count=' + filtered.length);
      return await this.#enrichAndSortMessages(filtered);
    } catch (error) {
      logger.error('Error getting messages by document ID ' + docId + ':', error);
      throw error;
    }
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chat' });
      logger.info('[chats.getAllMessages] fetch=' + (Date.now() - t0) + 'ms, count=' + allocations.length);
      return await this.#enrichAndSortMessages(allocations);
    } catch (error) {
      logger.error('Error getting all messages:', error);
      throw error;
    }
  }

  /**
   * Create a new `chatLike` pin. Likes are stored as independent pins keyed
   * by `chatId` so they don't force the chat pin (and its cid) to be
   * recreated on every reaction. Returns the new pin cid.
   */
  async createLike(like: ChatLikeRequest): Promise<string> {
    try {
      const likeMeta = { ...like.meta };
      delete likeMeta.creatorName;
      const form = createJsonFormData({ ...like, meta: likeMeta });
      const metadataQuery = buildMetadataQuery(likeMeta);
      const clusterResp = await clusterClient.post('/add?stream-channels=false' + metadataQuery, form, {
        headers: { ...form.getHeaders() },
      });
      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating chat like:', error);
      throw error;
    }
  }

  async deleteLike(likeCid: string): Promise<void> {
    try {
      await clusterClient.delete('/pins/' + encodeURIComponent(likeCid));
    } catch (error) {
      logger.error('Error unpinning chat like ' + likeCid + ':', error);
      throw error;
    }
  }

  /**
   * Return all likes for the chats with the given `chatId`s. Performed as a
   * single allocations scan so callers (e.g. the timeline endpoint) can fetch
   * likes for every message in the document with one round-trip.
   */
  async getLikesForChatIds(chatIds: string[]): Promise<ChatLike[]> {
    if (chatIds.length === 0) return [];
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chatLike' });
      const idSet = new Set(chatIds);
      const filtered = allocations.filter((a) => a.metadata?.chatId && idSet.has(a.metadata.chatId));
      return await this.#enrichLikes(filtered);
    } catch (error) {
      logger.error('Error getting chat likes:', error);
      throw error;
    }
  }

  /**
   * Find the (at most one) like a given user has placed on a chat. Used to
   * make the like endpoints idempotent and to support unlike.
   */
  async findUserLikeForChat(
    chatId: string,
    userId: string,
    nodeId: string,
  ): Promise<ChatLike | null> {
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'chatLike' });
      const match = allocations.find(
        (a) =>
          a.metadata?.chatId === chatId &&
          a.metadata?.creatorUserId === userId &&
          a.metadata?.creatorNodeId === nodeId,
      );
      if (!match) return null;
      const [enriched] = await this.#enrichLikes([match]);
      return enriched ?? null;
    } catch (error) {
      logger.error('Error finding user like for chat ' + chatId + ':', error);
      throw error;
    }
  }

  async #enrichAndSortMessages(allocations: AllocationPin[]): Promise<ChatMessage[]> {
    const result = await Promise.all(
      allocations.map(async (alloc) => {
        const pin = { cid: alloc.cid, name: '', origins: [], meta: { app_id: '', ...(alloc.metadata ?? {}) } };
        const chat = transformPinToChatMessage(pin);
        const userData = await usersIpfsRepository.getUserData(chat.meta.creatorNodeId, chat.meta.creatorUserId);
        return { ...chat, meta: { ...chat.meta, creatorName: userData.userName } };
      }),
    );
    return result.sort((a, b) => Number(a.meta.timestamp) - Number(b.meta.timestamp));
  }

  async #enrichLikes(allocations: AllocationPin[]): Promise<ChatLike[]> {
    return await Promise.all(
      allocations.map(async (alloc) => {
        const pin = { cid: alloc.cid, name: '', origins: [], meta: { app_id: '', ...(alloc.metadata ?? {}) } };
        const like = transformPinToChatLike(pin);
        const userData = await usersIpfsRepository.getUserData(like.meta.creatorNodeId, like.meta.creatorUserId);
        return { ...like, meta: { ...like.meta, creatorName: userData.userName } };
      }),
    );
  }
}

export const chatsIpfsRepository = new ChatsIpfsRepository();


import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToChatMessage } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { ChatMessageRequest } from '../../../shared/types/interfaces';
import { ChatMessage } from '../../../shared/types/interfaces/truspace';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }) {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;
  let result: Array<{ cid: string; metadata?: Record<string, string> }> = [];
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
    result = result.filter((a: { cid: string; metadata?: Record<string, string> }) =>
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
   * Replace an existing chat message pin with a new one carrying updated
   * `data` and an `editedTimestamp`. Because IPFS content is immutable, we
   * create a fresh pin (which produces a new cid) and unpin the old one. All
   * other metadata - including the original `timestamp` - is preserved so the
   * message stays in its original position in the timeline.
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

  async #enrichAndSortMessages(allocations: Array<{ cid: string; metadata?: Record<string, string> }>): Promise<ChatMessage[]> {
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
}

export const chatsIpfsRepository = new ChatsIpfsRepository();
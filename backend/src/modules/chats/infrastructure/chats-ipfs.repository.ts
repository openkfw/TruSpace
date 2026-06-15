// @ts-nocheck
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
  let result = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch(e) { return null; } })
      .filter(Boolean);
  } else if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.allocations)) {
    result = data.allocations;
  }
  if (primaryFilter) {
    result = result.filter((a) => a.metadata && a.metadata[primaryFilter.key] === primaryFilter.value);
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

  async #enrichAndSortMessages(allocations): Promise<ChatMessage[]> {
    const result = await Promise.all(
      allocations.map(async (alloc) => {
        const pin = { cid: alloc.cid, meta: alloc.metadata ?? {} };
        const chat = transformPinToChatMessage(pin);
        const userData = await usersIpfsRepository.getUserData(chat.meta.creatorNodeId, chat.meta.creatorUserId);
        return { ...chat, meta: { ...chat.meta, creatorName: userData.userName } };
      }),
    );
    return result.sort((a, b) => Number(a.meta.timestamp) - Number(b.meta.timestamp));
  }
}

export const chatsIpfsRepository = new ChatsIpfsRepository();
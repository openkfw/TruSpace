import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToChatMessage } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { ChatMessageRequest, PinningResponse } from '../../../shared/types/interfaces';
import { ChatMessage } from '../../../shared/types/interfaces/truspace';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

class ChatsIpfsRepository {
  async createMessage(message: ChatMessageRequest): Promise<string> {
    try {
      const messageMeta = { ...message.meta };
      delete messageMeta.creatorName;

      const form = createJsonFormData({ ...message, meta: messageMeta });
      const metadataQuery = buildMetadataQuery(messageMeta);

      const clusterResp = await clusterClient.post(`/add?stream-channels=false${metadataQuery}`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesByDocumentId(docId: string): Promise<ChatMessage[]> {
    try {
      const res = await pinSvcClient.get(`/pins?limit=1000&meta={"type":"chat","docId":"${docId}"}`);

      return await this.#enrichAndSortMessages(res.data);
    } catch (error) {
      logger.error(`Error getting messages by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    try {
      const res = await pinSvcClient.get(`/pins?limit=1000&meta={"type":"chat"}`);

      return await this.#enrichAndSortMessages(res.data);
    } catch (error) {
      logger.error('Error getting all messages:', error);
      throw error;
    }
  }

  async #enrichAndSortMessages(pinningResponse: PinningResponse): Promise<ChatMessage[]> {
    const result = await Promise.all(
      pinningResponse.results.map(async (element) => {
        const chat = transformPinToChatMessage(element.pin);
        const userData = await usersIpfsRepository.getUserData(chat.meta.creatorNodeId, chat.meta.creatorUserId);

        return {
          ...chat,
          meta: {
            ...chat.meta,
            creatorName: userData.userName,
          },
        };
      }),
    );

    return result.sort((a, b) => Number(a.meta.timestamp) - Number(b.meta.timestamp));
  }
}

export const chatsIpfsRepository = new ChatsIpfsRepository();

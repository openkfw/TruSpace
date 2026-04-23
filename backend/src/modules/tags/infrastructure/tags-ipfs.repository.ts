import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToTag } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { PinRequest, PinningResponse } from '../../../shared/types/interfaces';
import { Tag, TagRequest } from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

class TagsIpfsRepository {
  async createTag(tag: TagRequest): Promise<string> {
    try {
      const form = createJsonFormData(tag);
      const metadataQuery = buildMetadataQuery(tag.meta);

      const clusterResp = await clusterClient.post(`/add?stream-channels=false${metadataQuery}`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating tag:', error);
      throw error;
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    try {
      const safeTagId = assertAndEncodeURIComponent(tagId);
      await clusterClient.delete(`/pins/${safeTagId}`);
    } catch (error) {
      logger.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  }

  async getTagsByDocumentId(docId: string): Promise<Tag[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"tag","docId":"${docId}"}`)
      ).data;

      return await this.#enrichTags(pinRes.results);
    } catch (error) {
      logger.error(`Error getting tags by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getTagsByVersionCid(cid: string): Promise<Tag[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"tag","versionCid":"${cid}"}`)
      ).data;

      return await this.#enrichTags(pinRes.results);
    } catch (error) {
      logger.error(`Error getting tags by version CID ${cid}:`, error);
      throw error;
    }
  }

  async #enrichTags(pinRequests: PinRequest[]): Promise<Tag[]> {
    return await Promise.all(
      pinRequests.map(async (pinRequest) => {
        const tag = transformPinToTag(pinRequest.pin);
        const userData = await usersIpfsRepository.getUserData(tag.meta.creatorNodeId, tag.meta.creatorUserId);

        return {
          ...tag,
          meta: {
            ...tag.meta,
            creatorName: (tag.meta.creatorType ?? 'user') === 'user' ? userData.userName : tag.meta.creatorUserId,
          },
        };
      }),
    );
  }
}

export const tagsIpfsRepository = new TagsIpfsRepository();

import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToTag } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { Tag, TagRequest } from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;

  let result: AllocationPin[] = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((l) => { try { return JSON.parse(l); } catch(_e) { return null; } })
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

class TagsIpfsRepository {
  async createTag(tag: TagRequest): Promise<string> {
    try {
      const form = createJsonFormData(tag);
      const metadataQuery = buildMetadataQuery(tag.meta);
      const clusterResp = await clusterClient.post('/add?stream-channels=false' + metadataQuery, form, {
        headers: { ...form.getHeaders() },
      });
      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating tag:', error);
      throw error;
    }
  }

  async deleteTag(tagId: string): Promise<void> {
    try {
      await clusterClient.delete('/pins/' + assertAndEncodeURIComponent(tagId));
    } catch (error) {
      logger.error('Error deleting tag ' + tagId + ':', error);
      throw error;
    }
  }

  async getTagsByWorkspaceId(workspaceId: string): Promise<Tag[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'tag' });
      const filtered = allocations.filter((a) => a.metadata?.workspaceOrigin === workspaceId);
      logger.info('[tags.getTagsByWorkspaceId] fetch=' + (Date.now() - t0) + 'ms, total=' + allocations.length + ' filtered=' + filtered.length);
      return filtered.map((a) => transformPinToTag({ cid: a.cid, name: '', origins: [], meta: { app_id: '', ...(a.metadata ?? {}) } }));
    } catch (error) {
      logger.error('Error getting tags by workspace ID ' + workspaceId + ':', error);
      throw error;
    }
  }

  async getTagsByDocumentId(docId: string): Promise<Tag[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'tag' });
      const filtered = allocations.filter((a) => a.metadata?.docId === docId);
      logger.info('[tags.getTagsByDocumentId] fetch=' + (Date.now() - t0) + 'ms, filtered=' + filtered.length);
      const t1 = Date.now();
      const result = await this.#enrichTags(filtered);
      logger.info('[tags.getTagsByDocumentId] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting tags by document ID ' + docId + ':', error);
      throw error;
    }
  }

  async getTagsByVersionCid(cid: string): Promise<Tag[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'tag' });
      const filtered = allocations.filter((a) => a.metadata?.versionCid === cid);
      logger.info('[tags.getTagsByVersionCid] fetch=' + (Date.now() - t0) + 'ms, filtered=' + filtered.length);
      const t1 = Date.now();
      const result = await this.#enrichTags(filtered);
      logger.info('[tags.getTagsByVersionCid] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting tags by version CID ' + cid + ':', error);
      throw error;
    }
  }

  async #enrichTags(allocations: AllocationPin[]): Promise<Tag[]> {
    return await Promise.all(
      allocations.map(async (alloc) => {
        const tag = transformPinToTag({ cid: alloc.cid, name: '', origins: [], meta: { app_id: '', ...(alloc.metadata ?? {}) } });
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
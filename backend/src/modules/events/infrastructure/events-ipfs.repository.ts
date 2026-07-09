import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToEvent } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { Event, EventRequest } from '../../../shared/types/interfaces/truspace';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;

  let result: AllocationPin[] = [];
  if (typeof data === 'string') {
    result = data
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
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

class EventsIpfsRepository {
  /**
   * Persist an event in IPFS as a pinned JSON object with `meta-type=event`.
   * The full event meta is replicated as pin metadata so events can be queried
   * via the cluster allocations endpoint without fetching the file body.
   */
  async createEvent(event: EventRequest): Promise<string> {
    const eventMeta = { ...event.meta };
    // actorName is resolved at read time, never persisted.
    delete eventMeta.actorName;

    // Encode any free-text fields so the cluster query string stays well-formed.
    const metadataQuery = buildMetadataQuery(eventMeta, { encodeValueKeys: ['objectName'] });
    const form = createJsonFormData({ ...event, meta: eventMeta });

    const clusterResp = await clusterClient.post(`/add?stream-channels=false${metadataQuery}`, form, {
      headers: { ...form.getHeaders() },
    });
    return clusterResp.data[0].cid;
  }

  async getEventsByDocumentId(docId: string): Promise<Event[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'event' });
      const filtered = allocations.filter((a) => a.metadata?.docId === docId);
      logger.info('[events.getEventsByDocumentId] fetch=' + (Date.now() - t0) + 'ms, count=' + filtered.length);
      return await this.#enrichAndSortEvents(filtered);
    } catch (error) {
      logger.error('Error getting events by document ID ' + docId + ':', error);
      throw error;
    }
  }

  async getEventsByWorkspaceId(workspaceId: string): Promise<Event[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'event' });
      const filtered = allocations.filter((a) => a.metadata?.workspaceOrigin === workspaceId);
      logger.info('[events.getEventsByWorkspaceId] fetch=' + (Date.now() - t0) + 'ms, count=' + filtered.length);
      return await this.#enrichAndSortEvents(filtered);
    } catch (error) {
      logger.error('Error getting events by workspace ID ' + workspaceId + ':', error);
      throw error;
    }
  }

  async #enrichAndSortEvents(allocations: AllocationPin[]): Promise<Event[]> {
    const result = await Promise.all(
      allocations.map(async (alloc) => {
        const pin = { cid: alloc.cid, name: '', origins: [], meta: { app_id: '', ...(alloc.metadata ?? {}) } };
        const event = transformPinToEvent(pin);

        // AI actors don't have user data to look up - the userId stores the model name.
        if (event.meta.actorType === 'ai') {
          return event;
        }

        if (!event.meta.actorNodeId || !event.meta.actorUserId) {
          return event;
        }

        const userData = await usersIpfsRepository.getUserData(event.meta.actorNodeId, event.meta.actorUserId);
        return {
          ...event,
          meta: { ...event.meta, actorName: userData.userName },
        };
      }),
    );

    return result.sort(
      (a, b) => new Date(a.meta.timestamp).getTime() - new Date(b.meta.timestamp).getTime(),
    );
  }
}

export const eventsIpfsRepository = new EventsIpfsRepository();

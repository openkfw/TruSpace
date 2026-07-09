import { v4 as uuidv4 } from 'uuid';

import logger from '../../../shared/config/winston';
import {
  EventAction,
  EventActorType,
  EventMeta,
  EventRequest,
  EventType,
} from '../../../shared/types/interfaces/truspace';
import { eventsIpfsRepository } from '../infrastructure/events-ipfs.repository';

/**
 * Input accepted by {@link recordEvent}. The use case fills in `eventId`,
 * `timestamp`, `type` and the default `actorType`, so callers only have to
 * provide what is specific to the event.
 */
export interface RecordEventInput {
  eventType: EventType;
  eventAction: EventAction;
  objectId: string;
  workspaceOrigin: string;
  objectName?: string;
  docId?: string;
  versionCid?: string;
  version?: string;
  actorType?: EventActorType;
  actorNodeId?: string;
  actorUserId?: string;
  /** Override timestamp (ISO 8601). Defaults to now. */
  timestamp?: string;
}

/**
 * Record an activity event. Failures are logged but never propagated so that
 * event recording cannot break the surrounding business operation (creating a
 * document, deleting a tag, ...). Treat events as a best-effort audit trail.
 */
export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    const meta: EventMeta = {
      type: 'event',
      eventId: uuidv4(),
      eventType: input.eventType,
      eventAction: input.eventAction,
      objectId: input.objectId,
      objectName: input.objectName,
      workspaceOrigin: input.workspaceOrigin,
      docId: input.docId,
      versionCid: input.versionCid,
      version: input.version,
      actorType: input.actorType ?? 'user',
      actorNodeId: input.actorNodeId,
      actorUserId: input.actorUserId,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };

    const request: EventRequest = { meta };
    await eventsIpfsRepository.createEvent(request);
  } catch (error) {
    logger.error('Failed to record event:', error);
    // Intentionally swallowed - event recording must not break callers.
  }
}

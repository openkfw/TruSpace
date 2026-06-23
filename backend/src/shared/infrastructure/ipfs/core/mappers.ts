import { DocumentPin, DocumentPinRequest, Pin } from '../../../types/interfaces';
import {
  ChatMessage,
  Document,
  Event,
  EventAction,
  EventActorType,
  EventType,
  GeneralTemplateOfItemInWorkspace,
  Perspective,
  Tag,
  Workspace,
} from '../../../types/interfaces/truspace';

export function transformPinToWorkspace(pin: Pin): Workspace {
  return {
    cid: pin.cid,
    uuid: pin.meta.workspace_uuid,
    meta: {
      creatorNodeId: pin.meta.creatorNodeId || pin.meta.creator_id || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator_name || pin.meta.creator || '',
      created_at: pin.meta.created_at,
      type: 'workspace',
      workspace_uuid: pin.meta.workspace_uuid,
      name: pin.meta.name,
      is_public: pin.meta.is_public === 'true',
    },
  };
}

export function transformPinToDocument(pin: DocumentPin, language?: string): Document {
  return {
    docId: pin.meta.docId,
    cid: pin.cid,
    meta: {
      creatorNodeId: pin.meta.creatorNodeId || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator || '',
      workspaceOrigin: pin.meta.workspaceOrigin,
      filename: pin.meta.filename,
      timestamp: pin.meta.timestamp,
      version: pin.meta.version,
      encrypted: pin.meta.encrypted || 'false',
      size: pin.meta.size ? Number(pin.meta.size) : 0,
      language,
      versionTagName: pin.meta.versionTagName || '',
      malwareScanStatus: pin.meta.malwareScanStatus,
      malwareScanProvider: pin.meta.malwareScanProvider,
      malwareScanTimestamp: pin.meta.malwareScanTimestamp,
    },
  };
}

export function transformPinToChatMessage(pin: Pin): ChatMessage {
  return {
    cid: pin.cid,
    meta: {
      type: 'chat',
      cid: pin.meta.cid,
      timestamp: pin.meta.timestamp,
      docId: pin.meta.docId,
      perspectiveType: pin.meta.perspectiveType,
      data: pin.meta.data,
      creatorNodeId: pin.meta.creatorNodeId || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator || '',
      workspaceOrigin: pin.meta.workspaceOrigin,
      ...(pin.meta.editedTimestamp ? { editedTimestamp: pin.meta.editedTimestamp } : {}),
    },
  };
}

export function transformPinToPerspective(pin: Pin): Perspective {
  return {
    cid: pin.cid,
    meta: {
      type: 'perspective',
      perspectiveType: pin.meta.perspectiveType,
      workspaceOrigin: pin.meta.workspaceOrigin,
      docId: pin.meta.docId,
      versionCid: pin.meta.versionCid,
      timestamp: pin.meta.timestamp,
      data: pin.meta.data,
      creatorNodeId: pin.meta.creatorNodeId || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator || '',
      creatorType: pin.meta.creatorType,
      prompt: pin.meta.prompt,
    },
  };
}

export function transformPinToTag(pin: Pin): Tag {
  return {
    cid: pin.cid,
    meta: {
      type: 'tag',
      workspaceOrigin: pin.meta.workspaceOrigin,
      docId: pin.meta.docId,
      versionCid: pin.meta.versionCid,
      timestamp: pin.meta.timestamp,
      name: pin.meta.name,
      color: pin.meta.color,
      creatorNodeId: pin.meta.creatorNodeId || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator || '',
      creatorType: pin.meta.creatorType,
    },
  };
}

export function transformPinToGeneralWorkspaceItem(pin: Pin): GeneralTemplateOfItemInWorkspace {
  return {
    cid: pin.cid,
    meta: {
      type: pin.meta.type,
      workspaceOrigin: pin.meta.workspaceOrigin,
      docId: pin.meta.docId,
      timestamp: pin.meta.timestamp,
      creatorNodeId: pin.meta.creatorNodeId || '',
      creatorUserId: pin.meta.creatorUserId || '',
      creatorName: pin.meta.creatorName || pin.meta.creator_name || pin.meta.creator || '',
      creatorType: pin.meta.creatorType || 'user',
    },
  };
}

export function pinsToUniqueDocuments(pins: DocumentPinRequest[]): Document[] {
  return pins
    .sort((a: DocumentPinRequest, b: DocumentPinRequest) => Number(b.pin.meta.timestamp) - Number(a.pin.meta.timestamp))
    .filter((value, index, allPins) => allPins.findIndex((pin) => pin.pin.meta.docId === value.pin.meta.docId) === index)
    .map((element) => transformPinToDocument(element.pin));
}

export function transformPinToEvent(pin: Pin): Event {
  return {
    cid: pin.cid,
    meta: {
      type: 'event',
      eventId: pin.meta.eventId,
      eventType: pin.meta.eventType as EventType,
      eventAction: pin.meta.eventAction as EventAction,
      objectId: pin.meta.objectId,
      objectName: pin.meta.objectName ? decodeURIComponent(pin.meta.objectName) : undefined,
      workspaceOrigin: pin.meta.workspaceOrigin,
      docId: pin.meta.docId || undefined,
      versionCid: pin.meta.versionCid || undefined,
      version: pin.meta.version || undefined,
      actorType: (pin.meta.actorType as EventActorType) || 'user',
      actorNodeId: pin.meta.actorNodeId || undefined,
      actorUserId: pin.meta.actorUserId || undefined,
      actorName: pin.meta.actorName || undefined,
      timestamp: pin.meta.timestamp,
    },
  };
}

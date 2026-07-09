export type EventType = "document" | "tag" | "perspective";

export type EventAction =
   | "upload"
   | "version"
   | "create"
   | "update"
   | "delete";

export type EventActorType = "user" | "ai";

export interface EventMeta {
   type: "event";
   eventId: string;
   eventType: EventType;
   eventAction: EventAction;
   /** Stable identifier of the affected object (docId / tag cid / perspective cid). */
   objectId: string;
   /** Human-readable label (filename, tag name, perspective type). */
   objectName?: string;
   workspaceOrigin: string;
   docId?: string;
   versionCid?: string;
   /** Document version number (for "version" actions). */
   version?: string;
   actorType: EventActorType;
   actorNodeId?: string;
   actorUserId?: string;
   actorName?: string;
   /** ISO 8601 timestamp. */
   timestamp: string;
}

export interface EventRequest {
   meta: EventMeta;
}

export interface ActivityEvent extends EventRequest {
   cid: string;
}

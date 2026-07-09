export interface UserData {
  nodeId: string;
  userId: string;
  userName: string;
}

export interface File {
  name: string;
  encoding: string;
  mimetype: string;
  data: Buffer;
  size: number;
}

export interface DocumentMeta {
  filename: string;
  timestamp: string;
  version: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
  workspaceOrigin: string;
  encrypted: string;
  language?: string;
  size?: number;
  mimetype?: string;
  versionTagName?: string;
  malwareScanStatus?: string;
  malwareScanProvider?: string;
  malwareScanTimestamp?: string;
}

export interface DocumentRequest {
  docId: string;
  meta: DocumentMeta;
}

export interface Document extends DocumentRequest {
  docId: string;
  cid: string;
  meta: DocumentMeta;
  documentVersions?: DocumentVersion[];
  tags?: { name: string; color: string }[];
}

export interface DocumentsResponse {
  count: number;
  from?: number;
  limit?: number;
  data: Document[];
  availableTags?: { name: string; color: string }[];
  availableCreators?: string[];
}

export interface DocumentVersion {
  cid: string;
  meta: DocumentMeta;
  docId: string;
}

export interface DocumentWithVersions extends Document {
  docId: string;
  cid: string;
  meta: DocumentMeta;
  documentVersions: Document[];
}

export interface DocumentCreateResponse {
  uuid: string;
  cid: string;
}

interface WorkspaceMeta {
  workspace_uuid: string;
  type: "workspace";
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
  name: string;
  password_hash?: string;
  is_public: boolean;
  created_at: string;
}

export interface WorkspaceRequest {
  uuid: string;
  meta: WorkspaceMeta;
}

export interface WorkspaceCreateResponse {
  uuid: string;
  cid: string;
}

export interface Workspace extends WorkspaceRequest {
  cid: string;
}

interface ChatMessageMeta {
  type: "chat";
  data: string;
  perspectiveType: string;
  cid: string;
  docId: string;
  workspaceOrigin: string;
  timestamp: string;
  /**
   * Set when a chat message was edited by its author. Stored as an
   * epoch-millis string (matching `timestamp`). Absent for messages that
   * have never been edited.
   */
  editedTimestamp?: string;
  /**
   * Stable per-message identifier (UUIDv4) preserved across edits. Because
   * IPFS content is immutable, editing replaces the chat pin and yields a
   * new `cid`; `chatId` is what associated entities (e.g. likes) reference
   * so they survive edits. Older chats created before this field existed
   * fall back to their `cid` during reads.
   */
  chatId?: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
}

export interface ChatMessageRequest {
  meta: ChatMessageMeta;
}

export interface ChatLikeMeta {
  type: "chatLike";
  /**
   * Stable id of the liked chat. This is the only join key we need: chat
   * lookups by id already give us `docId` / `workspaceOrigin` when required,
   * so we don't duplicate them on every like pin.
   */
  chatId: string;
  timestamp: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
}

export interface ChatLikeRequest {
  meta: ChatLikeMeta;
}

export interface ChatLike extends ChatLikeRequest {
  cid: string;
}

export interface ChatMessage extends ChatMessageRequest {
  cid: string;
  isOwnMessage?: boolean;
  /**
   * Users who liked this message. Populated by the read path; not persisted
   * inside the chat pin itself (likes are independent `chatLike` pins).
   */
  likes?: ChatLike[];
  /** Convenience flag set when enriching for an authenticated reader. */
  isLikedByCurrentUser?: boolean;
}

interface PerspectiveMeta {
  type: "perspective";
  perspectiveType: string;
  workspaceOrigin: string;
  docId: string;
  versionCid: string;
  timestamp: string;
  data: string;
  creatorType: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
  prompt: string;
  model?: string;
}

export interface PerspectiveRequest {
  meta: PerspectiveMeta;
}

export interface Perspective extends PerspectiveRequest {
  cid: string;
}

export interface TagRequest {
  meta: TagMeta;
}

export interface Tag extends TagRequest {
  cid: string;
}

interface TagMeta {
  type: "tag";
  workspaceOrigin: string;
  docId: string;
  versionCid: string;
  timestamp: string;
  name: string;
  color: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorType: string;
  creatorName?: string;
}

export interface GeneralTemplateOfItemInWorkspace {
  cid: string;
  meta: GeneralTemplateOfItemInWorkspaceMeta;
}

interface GeneralTemplateOfItemInWorkspaceMeta {
  type: string;
  workspaceOrigin: string;
  docId: string;
  timestamp: string;
  creatorNodeId: string;
  creatorUserId: string;
  creatorName?: string;
  creatorType?: string;
}

interface LanguageMeta {
  type: "language";
  workspaceOrigin: string;
  docId: string;
  versionCid: string;
  timestamp: string;
  creatorType: string;
  language: string;
}

export interface LanguageRequest {
  meta: LanguageMeta;
}

/**
 * Activity event recorded for central document/workspace changes.
 *
 * Events are stored as their own pinned objects in IPFS (`type: "event"`) and
 * are displayed in the document chat as a lightweight activity stream next to
 * regular chat messages. Only the actor name is resolved at read time; the
 * other display-relevant fields (`objectName`, `version`, ...) are denormalised
 * into the meta so that the timeline still renders correctly even after the
 * referenced object (e.g. a tag) has been deleted.
 */
export type EventType = "document" | "tag" | "perspective";

export type EventAction =
  | "upload"   // initial document upload
  | "version"  // new document version
  | "create"   // tag / perspective created
  | "update"   // perspective updated
  | "delete"; // any object deleted

export type EventActorType = "user" | "ai";

export interface EventMeta {
  type: "event";
  eventId: string;
  eventType: EventType;
  eventAction: EventAction;
  /** Stable identifier of the affected object (docId / tag cid / perspective cid). */
  objectId: string;
  /** Human-readable label (filename, tag name, perspective type) for display. */
  objectName?: string;
  workspaceOrigin: string;
  /** Optional so that future workspace-level events can omit it. */
  docId?: string;
  /** CID of the document version the event relates to, when applicable. */
  versionCid?: string;
  /** Document version number (denormalised for display on "version" events). */
  version?: string;
  actorType: EventActorType;
  /** Empty for AI actors. */
  actorNodeId?: string;
  /** Empty for AI actors. */
  actorUserId?: string;
  /** Resolved at read time. */
  actorName?: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

export interface EventRequest {
  meta: EventMeta;
}

export interface Event extends EventRequest {
  cid: string;
}

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
  creator: string;
  workspaceOrigin: string;
  encrypted: string;
  language?: string;
  size?: number;
  mimetype?: string;
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
  creator_id: string;
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
  creator: string;
}

export interface ChatMessageRequest {
  meta: ChatMessageMeta;
}

export interface ChatMessage extends ChatMessageRequest {
  cid: string;
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
  creator: string;
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
  creator: string;
  creatorType: string;
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
  creator: string;
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

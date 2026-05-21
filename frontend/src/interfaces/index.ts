export * from "@/modules/documents/domain";
export * from "@/modules/workspaces/domain";

interface ChatMessageMeta {
   type: "chat";
   data: string;
   perspectiveType: string;
   cid: string;
   docId: string;
   workspaceOrigin: string;
   timestamp: string;
   creatorNodeId: string;
   creatorUserId: string;
   creatorName?: string;
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

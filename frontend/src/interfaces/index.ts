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
   language: string;
   versionTagName?: string;
}

export interface DocumentRequest {
   docId: string;
   meta: DocumentMeta;
}

export interface Document extends DocumentRequest {
   docId: string;
   cid: string;
   meta: DocumentMeta;
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
   logo: string | File;
   cid: string;
}

interface ChatMessageMeta {
   type: "chat";
   data: string;
   perspectiveType: string;
   cid: string;
   docId: string;
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
   timestamp: string;
}

export interface PerspectiveRequest {
   meta: PerspectiveMeta;
}

export interface Perspective extends PerspectiveRequest {
   cid: string;
}

export interface TextItem {
   str: string;
   dir: string;
   transform: [number, number, number, number, number, number];
   width: number;
   height: number;
   fontName: string;
   hasEOL: boolean;
}

export interface PdfJs {
   getDocument: (data: ArrayBuffer) => {
      promise: Promise<PdfDocument>;
   };
}

interface PdfDocument {
   numPages: number;
   getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfPage {
   getTextContent: () => Promise<PdfTextContent>;
}

interface PdfTextContent {
   items: Array<unknown>;
}

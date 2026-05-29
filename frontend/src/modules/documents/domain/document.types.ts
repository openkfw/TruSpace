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
}

export interface DocumentsResponse {
   count: number;
   from?: number;
   limit?: number;
   data: Document[];
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

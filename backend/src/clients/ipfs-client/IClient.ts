import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import {
  ChatMessage,
  ChatMessageRequest,
  Document,
  DocumentCreateResponse,
  DocumentRequest,
  File,
  Perspective,
  PerspectiveRequest,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from "../../types/interfaces";

export interface IClient {
  // workspace
  createWorkspace(
    workspace: WorkspaceRequest
  ): Promise<WorkspaceCreateResponse>;
  getAllWorkspaces(): Promise<Workspace[]>;
  getWorkspaceByName(name: string): Promise<Workspace[]>;
  getWorkspaceById(wId: string): Promise<Workspace[]>;
  getPublicWorkspaces(): Promise<Workspace[]>;
  getWorkspaceById(wId: string): Promise<Workspace[]>;
  deleteWorkspaceById(wCID: string, wUID: string): Promise<void>;

  // documents
  createDocument(
    doc: DocumentRequest,
    file: File
  ): Promise<DocumentCreateResponse>;
  getAllDocuments(): Promise<Document[]>; // remove getAllDocuments when workspaces are fully implemented
  getDocumentDetailsById(docId: string): Promise<Document>;
  getDocumentVersionDetailsByCid(cid: string): Promise<Document>;
  downloadDocumentVersionByCid(
    req: AuthenticatedRequest,
    res: Response,
    cid: string
  ): Promise<void>;
  getDocumentsByWorkspace(wId: string): Promise<Document[]>;

  // chat messages
  createMessage(message: ChatMessageRequest): Promise<string>;
  getMessagesByDocumentId(docId: string): Promise<ChatMessage[]>;

  // perspectives
  createPerspective(perspective: PerspectiveRequest): Promise<string>;
  getPerspectivesByDocumentId(docId: string): Promise<Perspective[]>;
  getPerspectivesByVersionCid(docId: string): Promise<Perspective[]>;
  // remove later when getting perspectives by document and version is implemented
  getAllPerspectives(): Promise<Perspective[]>;

  // status
  pinSvcStatus(): Promise<boolean>;
  gatewayStatus(): Promise<boolean>;
  clusterStatus(): Promise<boolean>;
}

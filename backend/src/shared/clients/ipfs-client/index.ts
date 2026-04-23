import { Response } from 'express';

import { chatsIpfsRepository } from '../../../modules/chats/infrastructure/chats-ipfs.repository';
import { documentsIpfsRepository } from '../../../modules/documents/infrastructure/documents-ipfs.repository';
import { healthIpfsRepository } from '../../../modules/health/infrastructure/health-ipfs.repository';
import { languagesIpfsRepository } from '../../../modules/languages/infrastructure/languages-ipfs.repository';
import { permissionsIpfsRepository } from '../../../modules/permissions/infrastructure/permissions-ipfs.repository';
import { perspectivesIpfsRepository } from '../../../modules/perspectives/infrastructure/perspectives-ipfs.repository';
import { tagsIpfsRepository } from '../../../modules/tags/infrastructure/tags-ipfs.repository';
import { usersIpfsRepository } from '../../../modules/users/infrastructure/users-ipfs.repository';
import { workspacesIpfsRepository } from '../../../modules/workspaces/infrastructure/workspaces-ipfs.repository';
import { AuthenticatedRequest } from '../../types';
import {
  ChatMessage,
  ChatMessageRequest,
  Document,
  DocumentCreateResponse,
  DocumentRequest,
  DocumentsResponse,
  File,
  LanguageRequest,
  Perspective,
  PerspectiveRequest,
  Tag,
  TagRequest,
  UserData,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from '../../types/interfaces';
import { UserPermissionDto } from '../../handlers/userPermissions';

let instance: IpfsClient;

export class IpfsClient {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  async downloadAvatar(_req: AuthenticatedRequest, res: Response, cid: string): Promise<void> {
    return usersIpfsRepository.downloadAvatar(res, cid);
  }

  async uploadAvatar(file: File): Promise<string> {
    return usersIpfsRepository.uploadAvatar(file);
  }

  async createUserData(userData: UserData): Promise<void> {
    return usersIpfsRepository.createUserData(userData);
  }

  async modifyUserData(userData: UserData): Promise<void> {
    return usersIpfsRepository.modifyUserData(userData);
  }

  async deleteUserData(nodeId: string, userId: string): Promise<void> {
    return usersIpfsRepository.deleteUserData(nodeId, userId);
  }

  async getUserData(nodeId: string, userId: string): Promise<UserData> {
    return usersIpfsRepository.getUserData(nodeId, userId);
  }

  async pinSvcStatus(): Promise<boolean> {
    return healthIpfsRepository.pinSvcStatus();
  }

  async gatewayStatus(): Promise<boolean> {
    return healthIpfsRepository.gatewayStatus();
  }

  async clusterStatus(): Promise<boolean> {
    return healthIpfsRepository.clusterStatus();
  }

  async clusterId() {
    return healthIpfsRepository.clusterId();
  }

  async getPeers() {
    return healthIpfsRepository.getPeers();
  }

  async getDocumentVersionDetailsByCid(cid: string): Promise<Document> {
    return documentsIpfsRepository.getDocumentVersionDetailsByCid(cid);
  }

  async getDocumentDetailsById(docId: string): Promise<Document> {
    return documentsIpfsRepository.getDocumentDetailsById(docId);
  }

  async getDocumentsByDocumentId(docId: string): Promise<Document[]> {
    return documentsIpfsRepository.getDocumentsByDocumentId(docId);
  }

  async downloadDocumentVersionByCid(req: AuthenticatedRequest, res: Response, cid: string): Promise<void> {
    return documentsIpfsRepository.downloadDocumentVersionByCid(req, res, cid);
  }

  async getDocumentVersionContentByCid(cid: string): Promise<{ data: Buffer; size: number }> {
    return documentsIpfsRepository.getDocumentVersionContentByCid(cid);
  }

  async createWorkspace(workspace: WorkspaceRequest): Promise<WorkspaceCreateResponse> {
    return workspacesIpfsRepository.createWorkspace(workspace);
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    return workspacesIpfsRepository.getAllWorkspaces();
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace[]> {
    return workspacesIpfsRepository.getWorkspaceById(workspaceId);
  }

  async getWorkspaceByName(name: string): Promise<Workspace[]> {
    return workspacesIpfsRepository.getWorkspaceByName(name);
  }

  async getPublicWorkspaces(): Promise<Workspace[]> {
    return workspacesIpfsRepository.getPublicWorkspaces();
  }

  async updateWorkspaceType(workspaceId: string, isPublic: boolean): Promise<void> {
    return workspacesIpfsRepository.updateWorkspaceType(workspaceId, isPublic);
  }

  async createDocument(doc: DocumentRequest, file: File): Promise<DocumentCreateResponse> {
    return documentsIpfsRepository.createDocument(doc, file);
  }

  async getAllDocuments(from: number = 0, limit: number = 100): Promise<DocumentsResponse> {
    return documentsIpfsRepository.getAllDocuments(from, limit);
  }

  async getDocumentsByWorkspace(
    workspaceId: string,
    from: number,
    limit: number,
    searchString: string = '',
  ): Promise<DocumentsResponse> {
    return documentsIpfsRepository.getDocumentsByWorkspace(workspaceId, from, limit, searchString);
  }

  async createMessage(message: ChatMessageRequest): Promise<string> {
    return chatsIpfsRepository.createMessage(message);
  }

  async getMessagesByDocumentId(docId: string): Promise<ChatMessage[]> {
    return chatsIpfsRepository.getMessagesByDocumentId(docId);
  }

  async getAllMessages(): Promise<ChatMessage[]> {
    return chatsIpfsRepository.getAllMessages();
  }

  async createPerspective(perspective: PerspectiveRequest): Promise<string> {
    return perspectivesIpfsRepository.createPerspective(perspective);
  }

  async getPerspectivesByDocumentId(docId: string): Promise<Perspective[]> {
    return perspectivesIpfsRepository.getPerspectivesByDocumentId(docId);
  }

  async getPerspectivesByVersionCid(cid: string): Promise<Perspective[]> {
    return perspectivesIpfsRepository.getPerspectivesByVersionCid(cid);
  }

  async getAllPerspectives(): Promise<Perspective[]> {
    return perspectivesIpfsRepository.getAllPerspectives();
  }

  async createTag(tag: TagRequest): Promise<string> {
    return tagsIpfsRepository.createTag(tag);
  }

  async deleteTag(tagId: string): Promise<void> {
    return tagsIpfsRepository.deleteTag(tagId);
  }

  async getTagsByDocumentId(docId: string): Promise<Tag[]> {
    return tagsIpfsRepository.getTagsByDocumentId(docId);
  }

  async getTagsByVersionCid(cid: string): Promise<Tag[]> {
    return tagsIpfsRepository.getTagsByVersionCid(cid);
  }

  async createLanguage(langRequest: LanguageRequest): Promise<string> {
    return languagesIpfsRepository.createLanguage(langRequest);
  }

  async createPermission(permission: UserPermissionDto): Promise<string> {
    return permissionsIpfsRepository.create(permission);
  }

  async findPermissionsByKey(key: string, value: string): Promise<UserPermissionDto[]> {
    return permissionsIpfsRepository.findByKey(key, value);
  }

  async deletePermission(permissionId: string): Promise<boolean> {
    return permissionsIpfsRepository.delete(permissionId);
  }

  async deletePermissionForWorkspace(workspaceId: string): Promise<number> {
    return permissionsIpfsRepository.deleteForWorkspace(workspaceId);
  }
}

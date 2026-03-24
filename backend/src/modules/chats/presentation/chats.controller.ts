import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';

import { getChatsByDocumentId } from '../application/get-chats-by-document-id.usecase';
import { getRecentChats } from '../application/get-chats-recent.usecase';
import { postChat } from '../application/post-chat.usecase';
import { getChatsExportByDocumentId } from '../application/get-chats-export-by-document-id.usecase';

export const ChatController = {
  getChatsByDocumentId: async (req: Request, res: Response) => {
    const { docId } = req.params;
    const result = await getChatsByDocumentId(docId);
    res.json(result);
  },

  getChatsExportByDocumentId: async (req: Request, res: Response) => {
    const { docId } = req.params;
    await getChatsExportByDocumentId(docId, res);
  },

  getRecentChats: async (req: AuthenticatedRequest, res: Response) => {
    const email = req.user?.email as string;
    const result = await getRecentChats(email);
    res.json(result);
  },

  postChat: async (req: AuthenticatedRequest, res: Response) => {
    const { data, cid, docId, workspaceOrigin } = req.body;
    const creatorNodeId = req.user?.nodeId as string;
    const creatorUserId = req.user?.uiid as string;
    const result = await postChat(creatorNodeId, creatorUserId, data, cid, docId, workspaceOrigin);
    res.json(result);
  },
};

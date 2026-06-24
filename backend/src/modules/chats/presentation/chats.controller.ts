import { Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';

import { ChatNotFoundError } from '../errors/chat-not-found.error';
import { ChatEditForbiddenError } from '../errors/edit-forbidden.error';
import { editChat } from '../application/edit-chat.usecase';
import { getChatsByDocumentId } from '../application/get-chats-by-document-id.usecase';
import { getRecentChats } from '../application/get-chats-recent.usecase';
import { likeChat } from '../application/like-chat.usecase';
import { postChat } from '../application/post-chat.usecase';
import { unlikeChat } from '../application/unlike-chat.usecase';

export const ChatsController = {
  getChatsByDocumentId: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getChatsByDocumentId(req.params.docId, {
      uiid: req.user?.uiid,
      nodeId: req.user?.nodeId,
    });
    res.json(result);
  },

  getRecentChats: async (req: AuthenticatedRequest, res: Response) => {
    const result = await getRecentChats(req.user?.email as string);
    res.json(result);
  },

  postChat: async (req: AuthenticatedRequest, res: Response) => {
    const result = await postChat(
      req.user?.nodeId as string,
      req.user?.uiid as string,
      req.body.data,
      req.body.cid,
      req.body.docId,
      req.body.workspaceOrigin,
    );
    res.json(result);
  },

  editChat: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await editChat(req.params.cid, req.body.data, {
        uiid: req.user?.uiid,
        nodeId: req.user?.nodeId,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ChatNotFoundError) {
        return res.status(404).json({ status: 'failure', message: error.message });
      }
      if (error instanceof ChatEditForbiddenError) {
        return res.status(403).json({ status: 'failure', message: error.message });
      }
      throw error;
    }
  },

  likeChat: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await likeChat(req.params.chatId, {
        uiid: req.user?.uiid,
        nodeId: req.user?.nodeId,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ChatNotFoundError) {
        return res.status(404).json({ status: 'failure', message: error.message });
      }
      throw error;
    }
  },

  unlikeChat: async (req: AuthenticatedRequest, res: Response) => {
    const result = await unlikeChat(req.params.chatId, {
      uiid: req.user?.uiid,
      nodeId: req.user?.nodeId,
    });
    res.json(result);
  },
};

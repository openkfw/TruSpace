import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../../shared/types';

import { getChatsByDocumentId } from '../application/get-chats-by-document-id.usecase';
import { getRecentChats } from '../application/get-chats-recent.usecase';
import { postChat } from '../application/post-chat.usecase';
import { getChatsExportByDocumentId } from '../application/get-chats-export-by-document-id.usecase';

export const ChatsController = {
  getChatsByDocumentId: async (req: Request, res: Response) => {
    const result = await getChatsByDocumentId(req.params.docId);
    res.json(result);
  },

  getChatsExportByDocumentId: async (req: Request, res: Response) => {
    const file = await getChatsExportByDocumentId(req.params.docId);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

    file.stream.pipe(res);
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
};

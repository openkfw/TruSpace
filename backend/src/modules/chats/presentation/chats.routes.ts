import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { getChatsByDocumentIdValidation, postChatValidation } from './chats.validators';
import { ChatController } from './chats.controller';

export const chatsRouter = express.Router();

chatsRouter.get(
  '/chats/:docId',
  authenticateCookie,
  getChatsByDocumentIdValidation,
  ChatController.getChatsByDocumentId,
);

chatsRouter.get('/chats/export/:docId', authenticateCookie, ChatController.getChatsExportByDocumentId);

chatsRouter.get('/chats/recent', authenticateCookie, ChatController.getRecentChats); // TODO check if this is really unused?

chatsRouter.post('/chats', authenticateCookie, postChatValidation, ChatController.postChat);

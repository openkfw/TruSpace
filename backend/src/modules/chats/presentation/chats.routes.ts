import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { ChatsValidator } from './chats.validators';
import { ChatsController } from './chats.controller';

export const chatsRouter = express.Router();

chatsRouter.get(
  '/chats/:docId',
  authenticateCookie,
  ChatsValidator.getChatsByDocumentId,
  ChatsController.getChatsByDocumentId,
);

chatsRouter.get('/chats/recent', authenticateCookie, ChatsController.getRecentChats);

chatsRouter.post('/chats', authenticateCookie, ChatsValidator.postChat, ChatsController.postChat);

chatsRouter.put(
  '/chats/:cid',
  authenticateCookie,
  ChatsValidator.editChat,
  ChatsController.editChat,
);

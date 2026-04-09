import { body, param } from 'express-validator';
import validate from '../../../shared/middlewares/validate';

export const ChatsValidator = {
  getChatsByDocumentId: validate([param('docId').isUUID(4)]),
  
  postChat: validate([
    body('cid').notEmpty(),
    body('docId').isUUID(4),
    body('workspaceOrigin').isUUID(4),
    body('data').notEmpty(),
  ])

};



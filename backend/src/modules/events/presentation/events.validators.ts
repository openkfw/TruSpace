import { param } from 'express-validator';

import validate from '../../../shared/middlewares/validate';

export const EventsValidator = {
  getEventsByDocumentId: validate([param('docId').isUUID(4)]),

  getEventsByWorkspaceId: validate([param('workspaceId').isUUID(4)]),
};

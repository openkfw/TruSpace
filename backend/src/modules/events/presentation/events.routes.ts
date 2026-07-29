import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';

import { EventsController } from './events.controller';
import { EventsValidator } from './events.validators';

export const eventsRouter = express.Router();

eventsRouter.get(
  '/events/document/:docId',
  authenticateCookie,
  EventsValidator.getEventsByDocumentId,
  EventsController.getEventsByDocumentId,
);

eventsRouter.get(
  '/events/workspace/:workspaceId',
  authenticateCookie,
  EventsValidator.getEventsByWorkspaceId,
  EventsController.getEventsByWorkspaceId,
);

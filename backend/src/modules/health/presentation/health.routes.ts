import express from 'express';

import { authenticateCookie } from '../../../shared/middlewares/authenticate';
import { HealthController } from './health.controller';

export const healthRouter = express.Router();

healthRouter.get('/health', authenticateCookie, HealthController.getHealth);

healthRouter.get('/health/peers', authenticateCookie, HealthController.getHealthPeers);

healthRouter.get('/health/graph', authenticateCookie, HealthController.getHealthGraph);

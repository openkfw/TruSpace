import { Request, Response } from 'express';
import { getHealth } from '../application/get-health.usecaste';
import { getHealthPeers } from '../application/get-health-peers.usecase';

export const HealthController = {
  getHealth: async (_req: Request, res: Response) => {
    const result = await getHealth();
    res.json(result);
  },

  getHealthPeers: async (_req: Request, res: Response) => {
    const result = await getHealthPeers();
    res.json(result);
  },
};

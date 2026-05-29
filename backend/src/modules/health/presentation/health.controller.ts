import { Request, Response } from 'express';
import { getHealth } from '../application/get-health.usecase';
import { getHealthGraph } from '../application/get-health-graph.usecase';
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

  getHealthGraph: async (_req: Request, res: Response) => {
    const result = await getHealthGraph();
    res.type('text/plain').send(result);
  },
};

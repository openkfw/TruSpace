import { Response } from 'express';
import taskQueue from '../../../shared/utility/jobQueue';

export async function getLanguageStatus(requestId: string, res: Response) {
  const job = await taskQueue.getJobStatus(requestId);

  if (!job?.status) {
    return res.status(200).json(null);
  }

  return {
    status: job?.status,
    jobsBefore: job?.jobsBefore,
    timestamp: job?.timestamp,
  };
}

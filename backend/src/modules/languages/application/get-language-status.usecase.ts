import taskQueue from '../../../shared/utility/jobQueue';

export async function getLanguageStatus(requestId: string) {
  const job = await taskQueue.getJobStatus(requestId);

  if (!job?.status) {
    return null;
  }

  return {
    status: job?.status,
    jobsBefore: job?.jobsBefore,
    timestamp: job?.timestamp,
  };
}

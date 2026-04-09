import { v4 as uuidv4 } from 'uuid';

import taskQueue from '../../../shared/utility/jobQueue';

export async function postCustomPerspective(cid: string, prompt: string, promptTitle: string) {
  const customSummaryTaskId = await taskQueue.addJob({
    templateId: 'perspectives',
    cid,
    prompts: [{ title: promptTitle, prompt }],
    identifier: uuidv4(),
  });

  return {
    requestId: `${customSummaryTaskId}`,
    message: 'Request accepted. Processing started for task.',
    statusEndpoint: `/api/perspectives/status/${customSummaryTaskId}`,
  };
}

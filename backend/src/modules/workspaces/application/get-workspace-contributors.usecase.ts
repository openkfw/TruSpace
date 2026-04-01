import logger from '../../../shared/config/winston';
import { getContributorsWorkspace } from '../../../shared/handlers/workspaces';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function getWorkspaceContributors(wId: string): Promise<UseCaseResponse> {
  try {
    const result = await getContributorsWorkspace(wId);
    return { body: result };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to fetch workspace contributors',
      },
    };
  }
}

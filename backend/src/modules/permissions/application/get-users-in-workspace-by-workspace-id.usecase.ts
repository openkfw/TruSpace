import logger from '../../../shared/config/winston';
import { findUsersInWorkspace } from '../../../shared/handlers/userPermissions';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function getUsersInWorkspaceByWorkspaceId(workspaceId: string): Promise<UseCaseResponse> {
  try {
    const results = await findUsersInWorkspace(workspaceId);
    return { body: results };
  } catch (error) {
    logger.error('Getting permissions error:', error);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Getting workspace permissions failed',
      },
    };
  }
}

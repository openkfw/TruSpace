import axios from 'axios';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { removePermissionsForWorkspace } from '../../../shared/handlers/userPermissions';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function deleteWorkspaceById(wCID: string, wUID: string): Promise<UseCaseResponse> {
  const client = new IpfsClient();

  try {
    await removePermissionsForWorkspace(wUID);
    await client.deleteWorkspaceById(wCID, wUID);
    return {
      body: {
        message: 'Workspace deleted successfully',
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        statusCode: 404,
        body: {
          message: 'Workspace not found',
        },
      };
    }

    logger.error('Error deleting workspace:', error);
    return {
      statusCode: 500,
      body: {
        message: 'Internal Server Error',
      },
    };
  }
}

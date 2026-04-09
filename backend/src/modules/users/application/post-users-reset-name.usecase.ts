import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { updateUserName } from '../../../shared/clients/db';
import logger from '../../../shared/config/winston';
import { UseCaseResponse } from '../../../shared/types/usecase';

const resolveNodeId = async (explicitNodeId?: string): Promise<string> => {
  if (explicitNodeId) {
    return explicitNodeId;
  }

  try {
    const clusterId = await new IpfsClient().clusterId();
    return clusterId?.ipfs?.id || '';
  } catch (error) {
    logger.error('Error resolving nodeId:', error);
    return '';
  }
};

export async function postUsersResetName(
  email: string | undefined,
  name: string,
  nodeId?: string,
  userId?: string,
): Promise<UseCaseResponse> {
  try {
    if (!email) {
      return {
        statusCode: 401,
        body: {
          message: 'Unauthorized',
        },
      };
    }

    await updateUserName(email, name);

    const resolvedNodeId = await resolveNodeId(nodeId);
    if (resolvedNodeId && userId) {
      try {
        await new IpfsClient().modifyUserData({
          nodeId: resolvedNodeId,
          userId,
          userName: name,
        });
      } catch (error) {
        logger.error('Error updating user data:', error);
      }
    }

    return {
      body: {
        status: 'success',
        message: 'Name updated successfully',
      },
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Could not update name',
      },
    };
  }
}

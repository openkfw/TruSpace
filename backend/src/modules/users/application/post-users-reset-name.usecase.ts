import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { updateUserName } from '../../../shared/clients/db';
import logger from '../../../shared/config/winston';
import { HttpError, InternalServerError, UnauthorizedError } from '../../../shared/errors';
import { UserNotFoundError } from '../errors/user-not-found.error';

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
) {
  try {
    if (!email) {
      throw new UnauthorizedError();
    }

    const updatedUsers = await updateUserName(email, name);

    if (!updatedUsers) {
      throw new UserNotFoundError(`email: ${email}`);
    }

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
      status: 'success',
      message: 'Name updated successfully',
    };
  } catch (error) {
    logger.error(error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new InternalServerError('Could not update name', error);
  }
}

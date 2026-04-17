import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { deleteUserByUiid } from '../../../shared/clients/db';
import { BadRequestError, InternalServerError } from '../../../shared/errors';
import { UserNotFoundError } from '../errors/user-not-found.error';

const resolveNodeId = async (explicitNodeId?: string): Promise<string> => {
  if (explicitNodeId) {
    return explicitNodeId;
  }

  try {
    const clusterId = await new IpfsClient().clusterId();
    const resolvedNodeId = clusterId?.ipfs?.id;

    if (!resolvedNodeId) {
      throw new InternalServerError('Failed to resolve node ID');
    }

    return resolvedNodeId;
  } catch (error) {
    logger.error('Error resolving nodeId:', error);
    throw new InternalServerError('Failed to resolve node ID', error);
  }
};

export async function deleteUser(userId: string, nodeId?: string) {
  if (!userId) {
    throw new BadRequestError('User ID missing');
  }

  const resolvedNodeId = await resolveNodeId(nodeId);

  const client = new IpfsClient();
  await client.deleteUserData(resolvedNodeId, userId);

  const deletedUsers = await deleteUserByUiid(userId);
  if (!deletedUsers) {
    throw new UserNotFoundError(userId);
  }

  return 'User deleted successfully';
}

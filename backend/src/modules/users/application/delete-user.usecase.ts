import { Response } from 'express';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import logger from '../../../shared/config/winston';
import { deleteUserByUiid } from '../../../shared/clients/db';

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

export async function deleteUser(userId: string, nodeId: string, res: Response) {
  const resolvedNodeId = await resolveNodeId(nodeId);

  if (resolvedNodeId && userId) {
    try {
      // Delete user data in ipfs
      const client = new IpfsClient();
      await client.deleteUserData(resolvedNodeId, userId);

      // Delete user in db
      await deleteUserByUiid(userId);

      res.json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting user data in IPFS:', error);
      res.status(500).json({
        status: 'failure',
        message: 'Error deleting user data',
      });
    }
  } else {
    res.status(400).json({
      status: 'failure',
      message: 'User ID or Node ID missing',
    });
  }
}

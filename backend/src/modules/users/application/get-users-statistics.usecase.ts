import { getTotalRecentlyAddedUsersDb, getTotalUsersDb } from '../../../shared/clients/db';
import logger from '../../../shared/config/winston';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function getUsersStatistics(): Promise<UseCaseResponse> {
  try {
    const totalUsers = await getTotalUsersDb();
    const recentlyAddedUsers = await getTotalRecentlyAddedUsersDb();

    return {
      body: {
        status: 'success',
        data: {
          totalUsers,
          recentlyAddedUsers,
        },
      },
    };
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'Unable to fetch statistics',
      },
    };
  }
}

import logger from '../../../shared/config/winston';
import { UseCaseResponse } from '../../../shared/types/usecase';
import { getUserSettings } from '../../../shared/utility/user';

export async function getUsersUserSettings(email: string): Promise<UseCaseResponse> {
  try {
    const userSettings = await getUserSettings(email);

    if (!userSettings) {
      return {
        statusCode: 404,
        body: {
          status: 'failure',
          message: 'User not found',
        },
      };
    }

    return {
      body: {
        status: 'success',
        data: {
          ...userSettings,
        },
      },
    };
  } catch (error) {
    logger.error(`Error fetching user settings: ${JSON.stringify(error, null, 2)}`);
    return {
      statusCode: 500,
      body: {
        status: 'failure',
        message: 'User settings fetch failed',
      },
    };
  }
}

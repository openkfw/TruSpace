import { getTotalRecentlyAddedUsersDb, getTotalUsersDb } from '../../../shared/clients/db';

export async function getUsersStatistics() {
  const totalUsers = await getTotalUsersDb();
  const recentlyAddedUsers = await getTotalRecentlyAddedUsersDb();

  return {
    totalUsers,
    recentlyAddedUsers,
  };
}

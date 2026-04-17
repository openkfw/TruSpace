import { getUserSettings } from '../../../shared/utility/user';
import { UserNotFoundError } from '../errors/user-not-found.error';

export async function getUsersUserSettings(email: string) {
  const userSettings = await getUserSettings(email);
  if (!userSettings) {
    throw new UserNotFoundError();
  }
  return userSettings;
}

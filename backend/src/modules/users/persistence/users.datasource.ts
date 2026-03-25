import db from '../../../shared/config/database';
import logger from '../../../shared/config/winston';
import { USER_STATUS } from '../../../shared/utility/constants';
import { UserSchema } from './users.schema';

export const createUserDb = async (name: string, email: string, hash: string, status: string, token: string) => {
  try {
    const userId = await db<UserSchema>('users')
      .insert({
        username: name,
        email: email,
        password_hash: hash,
        status: status,
        user_token: token,
      })
      .returning<number>('id');
    return userId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error('Error creating user:', error);
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      throw new Error('email taken');
    }

    return undefined;
  }
};

export const findUserByEmailDb = async (email: string) => {
  try {
    const user = await db<UserSchema>('users')
      .select(
        'id',
        'username',
        'email',
        'status',
        'uiid',
        'password_hash',
        'avatar_cid',
        'prefered_language',
        'notification_settings',
        'first_sign_in',
        'created_at',
      )
      .where({ email })
      .first();
    return user;
  } catch (error) {
    logger.error(`Error finding user ${email}:`, error);
    return undefined;
  }
};

export const findUserByUiidDb = async (uiid: string) => {
  try {
    const user = await db<UserSchema>('users')
      .select(
        'id',
        'username',
        'email',
        'status',
        'uiid',
        'password_hash',
        'avatar_cid',
        'prefered_language',
        'notification_settings',
        'created_at',
      )
      .where({ uiid })
      .first();
    return user;
  } catch (error) {
    logger.error(`Error finding user ${uiid}:`, error);
    return undefined;
  }
};

export const findUserByTokenDb = async (token: string) => {
  try {
    const user = await db<UserSchema>('users')
      .select('id', 'email', 'username', 'status')
      .where({ user_token: token })
      .first();
    return user;
  } catch (error) {
    logger.error('Error finding user:', error);
    return undefined;
  }
};

export const getTotalUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db('users').count('* as count');
    return typeof count === 'number' ? count : parseInt(count, 10);
  } catch (error) {
    logger.error('Error fetching total users:', error);
    throw new Error('Failed to fetch total users');
  }
};

export const getTotalRecentlyAddedUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db('users').count('* as count').whereRaw("created_at >= DATE('now', '-10 days')");
    return typeof count === 'number' ? count : parseInt(count, 10);
  } catch (error) {
    logger.error('Error fetching total users:', error);
    throw new Error('Failed to fetch total users');
  }
};

export const activateUserDb = async (userId: number): Promise<void> => {
  try {
    await db('users').where({ id: userId }).update({
      status: USER_STATUS.active,
      updated_at: db.fn.now(),
    });
  } catch (error) {
    logger.error('Error activating user:', error);
  }
};

export const storeUserSettingsDb = async (
  email: string,
  {
    avatarCid,
    preferedLanguage = 'en',
    notificationSettings,
  }: {
    avatarCid?: string;
    preferedLanguage?: string;
    notificationSettings?: string;
  } = {},
) => {
  try {
    await db<UserSchema>('users')
      .update({
        avatar_cid: avatarCid,
        prefered_language: preferedLanguage,
        notification_settings: notificationSettings,
        updated_at: db.fn.now(),
      })
      .where({ email: email });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error('Error updating user');
  }
};

export const updateUserName = async (email: string, name: string) => {
  try {
    await db<UserSchema>('users').update({ username: name }).where({ email: email });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error('Error updating user');
  }
};

export const updateUserPassword = async (userId: number, passwordHash: string) => {
  try {
    await db<UserSchema>('users')
      .update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      })
      .where({ id: userId });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error('Error updating user');
  }
};

export const updateUserToken = async (userId: number, token: string) => {
  try {
    await db<UserSchema>('users')
      .update({
        user_token: token,
        updated_at: db.fn.now(),
      })
      .where({ id: userId });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error('Error updating user');
  }
};

export const deleteUserById = async (userId: number) => {
  try {
    await db<UserSchema>('users').delete().where({ id: userId });
  } catch (error) {
    logger.error('Error deleting user', error);
    throw new Error('Error deleting user');
  }
};

export const updateUserFirstSignIn = async (userId: number, firstSignIn: string) => {
  try {
    await db<UserSchema>('users').update('first_sign_in', firstSignIn).where({ id: userId });
  } catch (error) {
    logger.error('Error deleting user', error);
    throw new Error('Error deleting user');
  }
};

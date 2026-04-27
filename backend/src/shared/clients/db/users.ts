import db from '../../config/database';
import logger from '../../config/winston';
import { USER_STATUS } from '../../utility/constants';

export const USER_EMAIL_TAKEN_ERROR = 'USER_EMAIL_TAKEN';

export interface UserDb {
  id: number;
  username: string;
  email: string;
  status: string;
  uiid: string;
  password_hash: string;
  user_token: string;
  first_sign_in?: string;
  avatar_cid?: string;
  prefered_language?: string; // ISO 639-1 code, e.g., "en", "de"
  notification_settings?: string; // JSON string
  created_at?: Date;
  updated_at?: Date;
}

export const createUserDb = async (name: string, email: string, hash: string, status: string, token: string) => {
  try {
    const userId = await db<UserDb>('users')
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
      throw new Error(USER_EMAIL_TAKEN_ERROR);
    }

    throw new Error('Failed to create user');
  }
};

export const findUserByEmailDb = async (email: string) => {
  try {
    const user = await db<UserDb>('users')
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
    throw new Error(`Failed to find user by email (${email})`);
  }
};

export const findUserByUiidDb = async (uiid: string) => {
  try {
    const user = await db<UserDb>('users')
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
    throw new Error(`Failed to find user by uiid (${uiid})`);
  }
};

export const findUserByTokenDb = async (token: string) => {
  try {
    const user = await db<UserDb>('users')
      .select('id', 'email', 'username', 'status')
      .where({ user_token: token })
      .first();
    return user;
  } catch (error) {
    logger.error('Error finding user:', error);
    throw new Error('Failed to find user by token');
  }
};

export const getTotalUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db('users').count('* as count');
    return typeof count === 'number' ? count : parseInt(count, 10);
  } catch (error) {
    logger.error('Error fetching total users:', error);
    throw new Error('Failed to fetch user statistics');
  }
};

export const getTotalRecentlyAddedUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db('users').count('* as count').whereRaw("created_at >= DATE('now', '-10 days')");
    return typeof count === 'number' ? count : parseInt(count, 10);
  } catch (error) {
    logger.error('Error fetching total users:', error);
    throw new Error('Failed to fetch user statistics');
  }
};

export const activateUserDb = async (userId: number): Promise<number> => {
  try {
    return await db('users').where({ id: userId }).update({
      status: USER_STATUS.active,
      updated_at: db.fn.now(),
    });
  } catch (error) {
    logger.error('Error activating user:', error);
    throw new Error('Failed to activate user');
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
    return await db<UserDb>('users')
      .update({
        avatar_cid: avatarCid,
        prefered_language: preferedLanguage,
        notification_settings: notificationSettings,
        updated_at: db.fn.now(),
      })
      .where({ email: email });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error(`Failed to update user settings (${email})`);
  }
};

export const updateUserName = async (email: string, name: string) => {
  try {
    return await db<UserDb>('users').update({ username: name }).where({ email: email });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error(`Failed to update user name (${email})`);
  }
};

export const updateUserPassword = async (userId: number, passwordHash: string) => {
  try {
    return await db<UserDb>('users')
      .update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      })
      .where({ id: userId });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error(`Failed to update user password (${userId})`);
  }
};

export const updateUserToken = async (userId: number, token: string) => {
  try {
    return await db<UserDb>('users')
      .update({
        user_token: token,
        updated_at: db.fn.now(),
      })
      .where({ id: userId });
  } catch (error) {
    logger.error('Error updating user', error);
    throw new Error(`Failed to update user token (${userId})`);
  }
};

export const deleteUserByUiid = async (userId: string) => {
  try {
    return await db<UserDb>('users').delete().where({ uiid: userId });
  } catch (error) {
    logger.error('Error deleting user', error);
    throw new Error(`Failed to delete user (${userId})`);
  }
};

export const updateUserFirstSignIn = async (userId: number, firstSignIn: string) => {
  try {
    return await db<UserDb>('users').update('first_sign_in', firstSignIn).where({ id: userId });
  } catch (error) {
    logger.error('Error updating user first sign-in flag', error);
    throw new Error(`Failed to update user first sign-in status (${userId})`);
  }
};

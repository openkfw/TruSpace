import db from '../../../shared/config/database';
import logger from '../../../shared/config/winston';
import { UserModel } from '../domain/users.model';
import { createUserDb } from '../persistence/users.datasource';
import { UserSchema } from '../persistence/users.schema';

function mapToModel(userSchema: UserSchema): UserModel {
  return {
    id: userSchema.id,
    username: userSchema.username,
    email: userSchema.email,
    status: userSchema.status,
    uiid: userSchema.uiid,
    hash: userSchema.password_hash,
    userToken: userSchema.user_token,
    avatarCid: userSchema.avatar_cid,
    preferedLanguage: userSchema.prefered_language,
    notificationSettings: userSchema.notification_settings,
    createdAt: userSchema.created_at,
    updatedAt: userSchema.updated_at,
  };
}

export const createUser = async (name: string, email: string, hash: string, status: string, token: string) => {
  const userId = await createUserDb(name, email, hash, status, token);
  if (!userId) {
    return undefined;
  }

  const userSchema = await db<UserSchema>('users').where({ id: userId }).first();
  if (!userSchema) {
    logger.error(`Created user ${email} could not be loaded from the database`);
    return undefined;
  }

  const userModel: UserModel = mapToModel(userSchema);
  return userModel;
};

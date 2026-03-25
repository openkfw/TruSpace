import db from '../../../shared/config/database';
import logger from '../../../shared/config/winston';
import { USER_STATUS } from '../../../shared/utility/constants';
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
  const userSchema: UserSchema = await createUserDb(name, email, hash, status, token);
  const userModel: UserModel = mapToModel(userSchema);
  return userModel;
};

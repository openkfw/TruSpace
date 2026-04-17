import { findUserByEmailDb } from '../../../shared/clients/db';
import { AvatarNotFoundError } from '../errors/avatar-not-found.error';

export async function getUsersAvatar(email: string) {
  const user = await findUserByEmailDb(email);
  if (!user?.avatar_cid) {
    throw new AvatarNotFoundError();
  }

  return user.avatar_cid;
}

import { findUserByEmailDb } from '../../../shared/clients/db';

export async function getUsersAvatar(email: string) {
  const user = await findUserByEmailDb(email);
  if (!user?.avatar_cid) {
     return null;
  }

  return user.avatar_cid;
}

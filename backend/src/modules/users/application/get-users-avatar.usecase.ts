import { findUserByEmailDb } from '../../../shared/clients/db';

export async function getUsersAvatar(email: string) {
  const user = await findUserByEmailDb(email);
  return user?.avatar_cid || null;
}

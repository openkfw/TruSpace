import db from "../../config/database";
import logger from "../../config/winston";

interface UserDb {
  id: number;
  username: string;
  email: string;
  status: string;
  password_hash: string;
  avatar_cid?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createUserDb = async (
  name: string,
  email: string,
  hash: string,
  status: string = "active"
) => {
  try {
    const userId = await db<UserDb>("users")
      .insert({
        username: name,
        email: email,
        password_hash: hash,
        status: status,
      })
      .returning<number>("id");
    return userId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error("Error creating user:", error);
    if (error.message.includes("UNIQUE constraint failed: users.email")) {
      throw new Error("email taken");
    }

    return undefined;
  }
};

export const findUserByEmailDb = async (email: string) => {
  try {
    const user = await db<UserDb>("users")
      .select(
        "id",
        "username",
        "email",
        "status",
        "password_hash",
        "avatar_cid",
        "created_at"
      )
      .where({ email })
      .first();
    return user;
  } catch (error) {
    logger.error(`Error finding user ${email}:`, error);
    return undefined;
  }
};

export const getTotalUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db("users").count("* as count");
    return typeof count === "number" ? count : parseInt(count, 10);
  } catch (error) {
    logger.error("Error fetching total users:", error);
    throw new Error("Failed to fetch total users");
  }
};

export const getTotalRecentlyAddedUsersDb = async (): Promise<number> => {
  try {
    const [{ count }] = await db("users")
      .count("* as count")
      .whereRaw("created_at >= DATE('now', '-10 days')");
    return typeof count === "number" ? count : parseInt(count, 10);
  } catch (error) {
    logger.error("Error fetching total users:", error);
    throw new Error("Failed to fetch total users");
  }
};

export const storeAvatarCidDb = async (email: string, cid: string) => {
  try {
    await db<UserDb>("users")
      .update({ avatar_cid: cid })
      .where({ email: email });
  } catch (error) {
    logger.error("Error updating user", error);
    throw new Error("Error updating user");
  }
};

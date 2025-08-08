import db from "../../config/database";
import logger from "../../config/winston";
import { USER_STATUS } from "../../utility/constants";

export interface UserDb {
  id: number;
  username: string;
  email: string;
  status: string;
  uiid: string;
  password_hash: string;
  user_token: string;
  avatar_cid?: string;
  prefered_language?: string; // ISO 639-1 code, e.g., "en", "de"
  notification_settings?: string; // JSON string
  created_at?: Date;
  updated_at?: Date;
}

export const createUserDb = async (
  name: string,
  email: string,
  hash: string,
  status: string,
  token: string
) => {
  try {
    const userId = await db<UserDb>("users")
      .insert({
        username: name,
        email: email,
        password_hash: hash,
        status: status,
        user_token: token,
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
        "uiid",
        "password_hash",
        "avatar_cid",
        "prefered_language",
        "notification_settings",
        "first_sign_in",
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

export const findUserByUiidDb = async (uiid: string) => {
  try {
    const user = await db<UserDb>("users")
      .select(
        "id",
        "username",
        "email",
        "status",
        "uiid",
        "password_hash",
        "avatar_cid",
        "prefered_language",
        "notification_settings",
        "created_at"
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
    const user = await db<UserDb>("users")
      .select("id", "email", "username", "status")
      .where({ user_token: token })
      .first();
    return user;
  } catch (error) {
    logger.error("Error finding user:", error);
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

export const activateUserDb = async (userId: number): Promise<void> => {
  try {
    await db("users")
      .where({ id: userId })
      .update({ status: USER_STATUS.active });
  } catch (error) {
    logger.error("Error activating user:", error);
  }
};

export const storeUserSettingsDb = async (
  email: string,
  {
    avatarCid,
    preferedLanguage = "en",
    notificationSettings,
  }: {
    avatarCid?: string;
    preferedLanguage?: string;
    notificationSettings?: string;
  } = {}
) => {
  try {
    await db<UserDb>("users")
      .update({
        avatar_cid: avatarCid,
        prefered_language: preferedLanguage,
        notification_settings: notificationSettings,
      })
      .where({ email: email });
  } catch (error) {
    logger.error("Error updating user", error);
    throw new Error("Error updating user");
  }
};

export const updateUserPassword = async (
  userId: number,
  passwordHash: string
) => {
  try {
    await db<UserDb>("users")
      .update({ password_hash: passwordHash })
      .where({ id: userId });
  } catch (error) {
    logger.error("Error updating user", error);
    throw new Error("Error updating user");
  }
};

export const updateUserToken = async (userId: number, token: string) => {
  try {
    await db<UserDb>("users")
      .update({ user_token: token })
      .where({ id: userId });
  } catch (error) {
    logger.error("Error updating user", error);
    throw new Error("Error updating user");
  }
};

export const deleteUserById = async (userId: number) => {
  try {
    await db<UserDb>("users").delete().where({ id: userId });
  } catch (error) {
    logger.error("Error deleting user", error);
    throw new Error("Error deleting user");
  }
};

export const updateUserFirstSignIn = async (
  userId: number,
  firstSignIn: string
) => {
  try {
    await db<UserDb>("users")
      .update("first_sign_in", firstSignIn)
      .where({ id: userId });
  } catch (error) {
    logger.error("Error deleting user", error);
    throw new Error("Error deleting user");
  }
};

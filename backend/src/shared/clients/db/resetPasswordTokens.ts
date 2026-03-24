import db from "../../config/database";
import logger from "../../config/winston";

interface ResetPasswordTokenDb {
  id: number;
  user_id: number;
  token: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createTokenDb = async (userId: number, token: string) => {
  try {
    await db<ResetPasswordTokenDb>("password_reset_tokens").insert({
      user_id: userId,
      token: token,
    });
  } catch (error) {
    logger.error(`Error creating entry for reset password token:`, error);
  }
};

export const getTokenDb = async (token: string) => {
  try {
    const result = await db<ResetPasswordTokenDb>("password_reset_tokens")
      .select()
      .where({ token: token })
      .first();
    return result;
  } catch (error) {
    logger.error("Error finding token in DB:", error);
    return undefined;
  }
};

export const removeTokensOfUserDb = async (userId: number) => {
  try {
    await db<ResetPasswordTokenDb>("password_reset_tokens")
      .del()
      .where({ user_id: userId });
  } catch (error) {
    logger.error("Error finding token in DB:", error);
  }
};

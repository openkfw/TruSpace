import { findUserByEmailDb, findUserByUiidDb, UserDb } from "../clients/db";

const createUserSettingsOutput = (
  user:
    | Pick<
        UserDb,
        | "id"
        | "username"
        | "email"
        | "status"
        | "uiid"
        | "password_hash"
        | "avatar_cid"
        | "prefered_language"
        | "notification_settings"
        | "created_at"
      >
    | undefined
) => {
  if (!user) {
    return null;
  }
  const notificationSettings =
    user.notification_settings && user.notification_settings !== ""
      ? JSON.parse(user.notification_settings)
      : {
          addedToWorkspace: false,
          documentChanged: false,
          documentChat: false,
          workspaceChange: false,
        };
  return {
    email: user.email,
    uiid: user.uiid,
    notificationSettings,
    preferedLanguage: user.prefered_language || "en",
  };
};

export const getUserSettings = async (email: string) => {
  const user = await findUserByEmailDb(email);
  return createUserSettingsOutput(user);
};

export const getUserSettingsByUiid = async (uiid: string) => {
  const user = await findUserByUiidDb(uiid);
  return createUserSettingsOutput(user);
};

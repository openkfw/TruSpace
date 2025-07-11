import { findUserByEmailDb } from "../clients/db";

export const getUserSettings = async (email: string) => {
  const user = await findUserByEmailDb(email);
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
    notificationSettings,
    preferedLanguage: user.prefered_language || "en",
  };
};

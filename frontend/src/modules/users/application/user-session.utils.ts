import type { User, UserSettings } from "../domain";
import { getUserInitials } from "../domain";
import {
   downloadAvatar,
   downloadAvatarCid,
   downloadUserSettings
} from "../infrastructure";

const routesWithoutToken = [
   "/confirm",
   "/forgot-password",
   "/login",
   "/register",
   "/reset-password"
];

export const isRouteWithoutUserSession = (pathname: string) => {
   return routesWithoutToken.some((route) => route.includes(pathname));
};

export const isUserTokenExpired = (expires: number): boolean => {
   const isExpired = new Date(expires * 1000).getTime() < Date.now();

   if (isExpired) {
      console.warn("login token is expired");
   }

   return isExpired;
};

export const normalizeUserSession = (
   user: Omit<User, "initials"> & { initials?: string }
): User => {
   return {
      ...user,
      initials: getUserInitials(user.name)
   };
};

export const serializeUserSession = (user: User) => {
   const { avatar: _avatar, ...userForCookie } = user;
   return userForCookie;
};

export const loadUserProfileDetails = async (): Promise<{
   avatar?: string;
   settings?: UserSettings;
}> => {
   const profile: {
      avatar?: string;
      settings?: UserSettings;
   } = {};

   const userSettings = await downloadUserSettings();

   if (userSettings.status === "success") {
      profile.settings = userSettings.data;
   }

   const avatarCid = await downloadAvatarCid();

   if (!avatarCid) {
      return profile;
   }

   const response = await downloadAvatar(avatarCid);

   if (!response?.ok) {
      return profile;
   }

   const blob = await response.blob();
   profile.avatar = URL.createObjectURL(blob);

   return profile;
};

export const scheduleTokenExpirationCheck = (
   expires: number,
   onExpire: () => void
) => {
   const expiresAt = new Date(expires * 1000).getTime();
   const timeUntilExpiration = expiresAt - Date.now();

   if (timeUntilExpiration <= 0) {
      onExpire();
      return () => undefined;
   }

   const checkInterval = Math.min(60000, timeUntilExpiration / 2);

   const intervalId = window.setInterval(() => {
      if (isUserTokenExpired(expires)) {
         onExpire();
      }
   }, checkInterval);

   const timeoutId = window.setTimeout(() => {
      if (isUserTokenExpired(expires)) {
         onExpire();
      }
   }, timeUntilExpiration);

   return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
   };
};

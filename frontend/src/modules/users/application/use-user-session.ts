"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import type { User, UserUpdates } from "../domain";
import {
   deleteLoginCookie,
   getLoginCookie,
   logout as logoutUser,
   setLoginCookie
} from "../infrastructure";

import {
   isRouteWithoutUserSession,
   isUserTokenExpired,
   loadUserProfileDetails,
   normalizeUserSession,
   scheduleTokenExpirationCheck,
   serializeUserSession
} from "./user-session.utils";

export interface UseUserSessionResult {
   user: User | null;
   loading: boolean;
   isLoggedIn: boolean;
   logout: () => Promise<void>;
   updateUser: (updates: UserUpdates) => void;
   updateAvatar: (avatarUrl: string) => void;
   updatePreferedLanguage: (language: string) => void;
   refreshUser: () => Promise<void>;
}

export const useUserSession = (): UseUserSessionResult => {
   const pathname = usePathname();
   const router = useRouter();
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const tokenCheckCleanup = useRef<(() => void) | null>(null);

   const clearTokenCheck = useCallback(() => {
      tokenCheckCleanup.current?.();
      tokenCheckCleanup.current = null;
   }, []);

   const handleTokenExpiration = useCallback(() => {
      setUser(null);
      deleteLoginCookie();
      clearTokenCheck();
      router.push("/login");
   }, [clearTokenCheck, router]);

   const fetchUserDetails = useCallback(async () => {
      try {
         const profileDetails = await loadUserProfileDetails();

         if (Object.keys(profileDetails).length === 0) {
            return null;
         }

         setUser((previousUser) =>
            previousUser ? { ...previousUser, ...profileDetails } : null
         );

         return profileDetails.avatar ?? null;
      } catch (error) {
         console.error("Error loading user profile details:", error);
      }

      return null;
   }, []);

   const initializeUser = useCallback(async () => {
      try {
         setLoading(true);

         const savedUser = getLoginCookie();

         if (!savedUser) {
            setUser(null);

            if (isRouteWithoutUserSession(pathname)) {
               return;
            }

            router.push("/login");
            return;
         }

         const userData = normalizeUserSession(
            JSON.parse(savedUser) as Omit<User, "initials"> & {
               initials?: string;
            }
         );

         if (isUserTokenExpired(userData.expires)) {
            deleteLoginCookie();
            setUser(null);
            router.push("/login");
            return;
         }

         setUser(userData);
         clearTokenCheck();
         tokenCheckCleanup.current = scheduleTokenExpirationCheck(
            userData.expires,
            handleTokenExpiration
         );

         try {
            await fetchUserDetails();
         } catch (profileError) {
            console.error(
               "Error fetching user profile details:",
               profileError
            );
         }
      } catch (error) {
         console.error("Error loading user session:", error);
         deleteLoginCookie();
         setUser(null);
         router.push("/login");
      } finally {
         setLoading(false);
      }
   }, [
      clearTokenCheck,
      fetchUserDetails,
      handleTokenExpiration,
      pathname,
      router
   ]);

   const refreshUser = useCallback(async () => {
      await initializeUser();
   }, [initializeUser]);

   useEffect(() => {
      initializeUser();

      return () => {
         clearTokenCheck();
      };
   }, [clearTokenCheck, initializeUser]);

   useEffect(() => {
      if (user) {
         try {
            setLoginCookie(serializeUserSession(user));
         } catch (error) {
            console.error("Error saving user session to cookies:", error);
         }
         return;
      }

      deleteLoginCookie();
   }, [user]);

   const logout = useCallback(async (): Promise<void> => {
      try {
         await logoutUser();
      } catch (error) {
         console.error("Failed to log out:", error);
      } finally {
         setUser(null);
         deleteLoginCookie();
         clearTokenCheck();
         router.push("/login");
      }
   }, [clearTokenCheck, router]);

   const updateUser = useCallback((updates: UserUpdates): void => {
      setUser((previousUser) => {
         if (!previousUser) {
            return null;
         }

         const updatedUser = {
            ...previousUser,
            ...updates
         };

         if (updates.name) {
            updatedUser.initials = normalizeUserSession(updatedUser).initials;
         }

         return updatedUser;
      });
   }, []);

   const updateAvatar = useCallback((avatarUrl: string): void => {
      setUser((previousUser) => {
         if (!previousUser) {
            return null;
         }

         return {
            ...previousUser,
            avatar: avatarUrl
         };
      });
   }, []);

   const updatePreferedLanguage = useCallback((language: string): void => {
      setUser((previousUser) => {
         if (!previousUser) {
            return null;
         }

         return {
            ...previousUser,
            settings: {
               ...previousUser.settings,
               preferedLanguage: language
            }
         };
      });
   }, []);

   return {
      user,
      loading,
      isLoggedIn: Boolean(user),
      logout,
      updateUser,
      updateAvatar,
      updatePreferedLanguage,
      refreshUser
   };
};

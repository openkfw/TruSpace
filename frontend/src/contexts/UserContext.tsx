"use client";
import {
   createContext,
   type ReactNode,
   useCallback,
   useContext,
   useEffect,
   useRef,
   useState
} from "react";

import { usePathname, useRouter } from "next/navigation";

import Cookies from "js-cookie";

import { COOKIE_NAME, deleteLoginCookie, setLoginCookie } from "@/lib";
import {
   downloadAvatar,
   downloadUserSettings,
   logout as apiLogout
} from "@/lib/services";

const routesWithoutToken = [
   "/confirm",
   "/forgot-password",
   "/login",
   "/register",
   "/reset-password"
];

interface User {
   name: string;
   email: string;
   uiid: string;
   avatar?: string;
   settings?: {
      preferedLanguage: string; // ISO 639-1 code, e.g., "en", "de"
      notificationSettings?: {
         addedToWorkspace?: boolean;
         removedFromWorkspace?: boolean;
         documentChanged?: boolean;
         documentChat?: boolean;
         workspaceChange?: boolean;
      };
   };
   loginTime?: string;
   expires: number; // milliseconds since UNIX epoch
   initials: string;
}

interface UserUpdates {
   name?: string;
   email?: string;
   avatar?: string;
   [key: string]: unknown;
}

interface UserContextType {
   user: User | null;
   loading: boolean;
   isLoggedIn: boolean;
   logout: () => void;
   updateUser: (updates: UserUpdates) => void;
   updateAvatar: (avatarUrl: string) => void;
   updatePreferedLanguage: (language: string) => void;
   refreshUser: () => Promise<void>;
}

const getInitials = (name: string) => {
   return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
   const context = useContext(UserContext);
   if (!context) {
      throw new Error("useUser must be used within a UserProvider");
   }
   return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
   const pathname = usePathname();
   const router = useRouter();
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

   const handleTokenExpiration = useCallback(() => {
      setUser(null);
      deleteLoginCookie();

      if (tokenCheckInterval.current) {
         clearInterval(tokenCheckInterval.current);
         tokenCheckInterval.current = null;
      }

      router.push("/login");
   }, [router]);

   const isTokenExpired = useCallback((expires: number): boolean => {
      const isExpired = new Date(expires * 1000).getTime() < Date.now();
      if (isExpired) {
         console.warn(`${COOKIE_NAME} token is expired`);
      }
      return isExpired;
   }, []);

   // Function to set up periodic token checking
   const setupTokenCheck = useCallback(
      (expires: number) => {
         if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
         }

         const expiresAt = new Date(expires * 1000).getTime();
         const now = Date.now();
         const timeUntilExpiration = expiresAt - now;

         // If already expired, handle immediately
         if (timeUntilExpiration <= 0) {
            handleTokenExpiration();
            return;
         }

         // Set up interval to check every minute, or sooner if token expires soon
         const checkInterval = Math.min(60000, timeUntilExpiration / 2);

         tokenCheckInterval.current = setInterval(() => {
            if (isTokenExpired(expires)) {
               handleTokenExpiration();
            }
         }, checkInterval);

         // Also set a timeout for exact expiration time
         setTimeout(() => {
            if (isTokenExpired(expires)) {
               handleTokenExpiration();
            }
         }, timeUntilExpiration);
      },
      [handleTokenExpiration, isTokenExpired]
   );

   const fetchUserDetails = useCallback(async () => {
      try {
         const userSettings = await downloadUserSettings();
         if (userSettings.status === "success") {
            setUser((prev) =>
               prev ? { ...prev, settings: userSettings.data } : null
            );
         }

         const response = await downloadAvatar();

         if (!response) {
            // No avatar uploaded yet — expected for new users
            return null;
         }

         if (response.ok) {
            const blob = await response.blob();
            const avatar = URL.createObjectURL(blob);
            setUser((prev) => (prev ? { ...prev, avatar } : null));
            return avatar;
         }
      } catch (err) {
         console.error("Error loading avatar:", err);
      }
      return null;
   }, []);

   const initializeUser = useCallback(async () => {
      try {
         setLoading(true);
         const savedUser = Cookies.get(COOKIE_NAME);

         if (!savedUser) {
            console.warn(
               `Couldn't load data from cookie ${COOKIE_NAME}: ${savedUser}`
            );
            setUser(null);
            if (routesWithoutToken.some((r) => r.includes(pathname))) return;
            router.push("/login");
            return;
         }

         const userData: User = JSON.parse(savedUser);

         if (isTokenExpired(userData.expires)) {
            deleteLoginCookie();
            setUser(null);
            router.push("/login");
            return;
         }

         setUser({
            ...userData,
            initials: getInitials(userData.name)
         });

         setupTokenCheck(userData.expires);

         try {
            await fetchUserDetails();
         } catch (avatarError) {
            console.error("Error fetching avatar:", avatarError);
            // Don't fail the entire login process if avatar fails
         }
      } catch (error) {
         console.error("Error loading user from cookie:", error);
         deleteLoginCookie();
         setUser(null);
         router.push("/login");
      } finally {
         setLoading(false);
      }
   }, [isTokenExpired, setupTokenCheck, router, pathname, fetchUserDetails]);

   const refreshUser = useCallback(async () => {
      await initializeUser();
   }, [initializeUser]);

   // Loading user data from cookie on mount
   useEffect(() => {
      initializeUser();

      return () => {
         if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
         }
      };
   }, [initializeUser]);

   // Save user data to cookie whenever user state changes
   useEffect(() => {
      if (user) {
         try {
            const userForCookie = { ...user };
            delete userForCookie.avatar; // Don't store blob URL in cookie

            setLoginCookie(userForCookie);
         } catch (error) {
            console.error("Error saving user to cookies:", error);
         }
      } else {
         deleteLoginCookie();
      }
   }, [user]);

   const logout = async (): Promise<void> => {
      try {
         await apiLogout();
      } catch (error) {
         console.error("Failed to log out:", error);
      } finally {
         setUser(null);
         deleteLoginCookie();

         if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
            tokenCheckInterval.current = null;
         }
         router.push("/login");
      }
   };

   const updateUser = (updates: UserUpdates): void => {
      setUser((prevUser) => {
         if (!prevUser) return null;

         const updatedUser = { ...prevUser, ...updates };

         if (updates.name) {
            updatedUser.initials = getInitials(updates.name);
         }

         return updatedUser;
      });
   };

   const updateAvatar = (avatarUrl: string): void => {
      setUser((prevUser) => {
         if (!prevUser) return null;
         return {
            ...prevUser,
            avatar: avatarUrl
         };
      });
   };

   const updatePreferedLanguage = (language: string): void => {
      setUser((prevUser) => {
         if (!prevUser) return null;
         return {
            ...prevUser,
            settings: {
               ...prevUser.settings,
               preferedLanguage: language
            }
         };
      });
   };

   const isLoggedIn: boolean = Boolean(user);

   const value: UserContextType = {
      user,
      loading,
      isLoggedIn,
      logout,
      updateUser,
      updateAvatar,
      updatePreferedLanguage,
      refreshUser
   };

   return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

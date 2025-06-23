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

import { useRouter } from "next/navigation";

import Cookies from "js-cookie";

import {
   COOKIE_NAME,
   COOKIE_OPTIONS,
   deleteLoginCookie,
   setLoginCookie
} from "@/lib";
import { downloadAvatar } from "@/lib/services";

interface User {
   name: string;
   email: string;
   avatar?: string;
   loginTime?: string;
   expires: number; // milliseconds since UNIX epoch
   initials: string;
}

interface UserData {
   name: string;
   email: string;
   avatar?: string;
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
   login: (userData: UserData) => void;
   logout: () => void;
   updateUser: (updates: UserUpdates) => void;
   updateAvatar: (avatarUrl: string) => void;
}

const getInitials = (name) => {
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
   const router = useRouter();
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

   const handleTokenExpiration = useCallback(() => {
      console.log("Token expired, logging out");
      setUser(null);
      deleteLoginCookie();

      if (tokenCheckInterval.current) {
         clearInterval(tokenCheckInterval.current);
         tokenCheckInterval.current = null;
      }

      router.push("/login");
   }, [router]);

   const isTokenExpired = useCallback((expires: number): boolean => {
      return new Date(expires * 1000).getTime() < Date.now();
   }, []);

   // Function to set up periodic token checking
   const setupTokenCheck = useCallback(
      (expires: number) => {
         // Clear existing interval
         if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
         }

         // Calculate time until expiration
         const expiresAt = new Date(expires * 1000).getTime();
         const now = Date.now();
         const timeUntilExpiration = expiresAt - now;

         // If already expired, handle immediately
         if (timeUntilExpiration <= 0) {
            handleTokenExpiration();
            return;
         }

         // Set up interval to check every minute, or sooner if token expires soon
         const checkInterval = Math.min(60000, timeUntilExpiration / 2); // Check every minute or halfway to expiration

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

   // Loading user data from cookie on mount
   useEffect(() => {
      const fetchAvatar = async () => {
         try {
            const response = await downloadAvatar();

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
      };

      const initializeUser = async () => {
         try {
            setLoading(true);
            const savedUser = Cookies.get(COOKIE_NAME);

            if (!savedUser) {
               console.log("No cookie found");
               router.push("/login");
               return;
            }

            const userData: User = JSON.parse(savedUser);

            if (isTokenExpired(userData.expires)) {
               console.log("Token expired");
               deleteLoginCookie();
               router.push("/login");
               return;
            }

            setUser({
               ...userData,
               initials: getInitials(userData.name)
            });

            setupTokenCheck(userData.expires);

            try {
               await fetchAvatar();
            } catch (avatarError) {
               console.error("Error fetching avatar:", avatarError);
               // Don't fail the entire login process if avatar fails
            }
         } catch (error) {
            console.error("Error loading user from cookie:", error);
            deleteLoginCookie();
            router.push("/login");
         } finally {
            setLoading(false);
         }
      };

      initializeUser();

      // Cleanup interval on unmount
      return () => {
         if (tokenCheckInterval.current) {
            clearInterval(tokenCheckInterval.current);
         }
      };
   }, [router, isTokenExpired, setupTokenCheck]);

   // Save user data to cookie whenever user state changes
   useEffect(() => {
      if (user) {
         try {
            const userForCookie = { ...user };
            delete userForCookie.avatar; // Don't store blob URL in cookie

            setLoginCookie(userForCookie, COOKIE_OPTIONS);
            Cookies.set(
               COOKIE_NAME,
               JSON.stringify(userForCookie),
               COOKIE_OPTIONS
            );
         } catch (error) {
            console.error("Error saving user to cookies:", error);
         }
      } else {
         deleteLoginCookie();
      }
   }, [user]);

   const login = (userData: UserData): void => {
      // You'll need to implement this based on your login response
      // This should include setting the expires timestamp
      console.log("Login function needs implementation", userData);
   };

   const logout = (): void => {
      setUser(null);
      deleteLoginCookie();

      // Clear token check interval
      if (tokenCheckInterval.current) {
         clearInterval(tokenCheckInterval.current);
         tokenCheckInterval.current = null;
      }

      router.push("/login");
   };

   const updateUser = (updates: UserUpdates): void => {
      setUser((prevUser) => {
         if (!prevUser) return null;

         const updatedUser = { ...prevUser, ...updates };

         // Regenerate initials if name changed
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

   const isLoggedIn: boolean = Boolean(user);

   const value: UserContextType = {
      user,
      loading,
      isLoggedIn,
      login,
      logout,
      updateUser,
      updateAvatar
   };

   return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

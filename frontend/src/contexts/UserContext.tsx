"use client";

import {
   createContext,
   type ReactNode,
   useContext,
   useEffect,
   useState
} from "react";

import { useRouter } from "next/navigation";

import Cookies from "js-cookie";

import { COOKIE_NAME } from "@/lib";
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

   const COOKIE_OPTIONS = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const
   };

   // Loading user data from cookie on mount
   useEffect(() => {
      const fetchAvatar = async () => {
         try {
            setLoading(true);
            const response = await downloadAvatar();

            if (response.ok) {
               const blob = await response.blob();
               const avatar = URL.createObjectURL(blob);
               setUser((prev) => ({ ...prev, avatar }));
            }
         } catch (err) {
            console.error("Error loading avatar:", err);
         } finally {
            setLoading(false);
         }
      };

      try {
         const savedUser = Cookies.get(COOKIE_NAME);
         if (!savedUser) {
            router.push("/login");
            return;
         }
         const userData: User = JSON.parse(savedUser);

         const expires = new Date(userData?.expires * 1000);
         if (expires.getTime() < Date.now()) {
            Cookies.remove(COOKIE_NAME);
            router.push("/login");
            return;
         }
         const initials = userData.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
         setUser({ ...userData, initials });
         fetchAvatar();
      } catch (error) {
         console.error("Error loading user from cookie:", error);
         Cookies.remove(COOKIE_NAME);
         router.push("/login");
         return;
      } finally {
         setLoading(false);
      }
   }, []);

   // Save user data to cookie whenever user state changes
   useEffect(() => {
      if (user) {
         try {
            Cookies.set(COOKIE_NAME, JSON.stringify(user), COOKIE_OPTIONS);
         } catch (error) {
            console.error("Error saving user to cookies:", error);
         }
      } else {
         Cookies.remove(COOKIE_NAME);
      }
   }, [user, COOKIE_OPTIONS]);

   const login = (_userData: UserData): void => {};

   const logout = (): void => {};

   const updateUser = (_updates: UserUpdates): void => {};

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

export type { User, UserContextType, UserData, UserUpdates };

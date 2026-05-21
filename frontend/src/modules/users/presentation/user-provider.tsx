"use client";

import {
   createContext,
   type ReactNode,
   useContext
} from "react";

import {
   useUserSession,
   type UseUserSessionResult} from "../application";

const UserContext = createContext<UseUserSessionResult | undefined>(undefined);

export const useUser = (): UseUserSessionResult => {
   const context = useContext(UserContext);

   if (!context) {
      throw new Error("useUser must be used within a UserProvider");
   }

   return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
   const value = useUserSession();

   return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

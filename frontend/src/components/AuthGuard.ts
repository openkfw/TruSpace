"use client";
import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import Cookies from "js-cookie";

import { useUser } from "@/contexts/UserContext";

import {
   COOKIE_NAME,
   deleteLoginCookie,
   isTokenExpired,
   redirectToLogin
} from "../lib";

interface LoginCookie {
   name: string;
   email: string;
   expires: number; // milliseconds since UNIX epoch
}

export const getLoginCookie = (): LoginCookie | null => {
   try {
      const loginCookie = Cookies.get(COOKIE_NAME);
      console.log(loginCookie);
      if (loginCookie) {
         const parsedCookie = JSON.parse(loginCookie || null);

         const expires = new Date(parsedCookie?.expires * 1000);
         if (expires.getTime() < Date.now()) {
            console.log("4");
            deleteLoginCookie();
         } else {
            return parsedCookie;
         }
      }
   } catch (error) {
      console.error("Error parsing login cookie:", error);
      console.log("5");
      deleteLoginCookie();
   }
};

const AuthGuard = ({ children }) => {
   const router = useRouter();
   const pathname = usePathname();
   const { isLoggedIn, loading } = useUser();

   useEffect(() => {
      // Define public paths that don't require authentication
      const publicPaths = ["/login", "/register", "/forgot-password"];

      const checkAuth = () => {
         if (loading) return;
         console.log("checkAuth called");
         console.log("isLoggedIn = ", isLoggedIn);
         // If no login data and current path isn't public, redirect to login
         if (!isLoggedIn && !publicPaths.includes(pathname)) {
            redirectToLogin(router);
            return;
         }

         if (publicPaths.includes(pathname)) {
            return;
         }

         try {
            const loginCookie = getLoginCookie();
            if (!loginCookie) return;

            if (isTokenExpired(loginCookie)) {
               console.log("1");
               deleteLoginCookie();
               redirectToLogin(router);
            } else {
               // Set up a timeout to check again when token expires
               const tokenExp = new Date(loginCookie.expires * 1000);
               const currentTime = new Date();
               const timeUntilExpiry =
                  tokenExp.getTime() - currentTime.getTime();

               if (timeUntilExpiry > 0) {
                  const expiryTimer = setTimeout(() => {
                     console.log("2");
                     deleteLoginCookie();
                     redirectToLogin(router);
                  }, timeUntilExpiry);

                  // Clear the timeout if component unmounts
                  return () => clearTimeout(expiryTimer);
               }
            }
         } catch (error) {
            console.error("Error parsing auth data:", error);
            console.log("3");
            deleteLoginCookie();
            redirectToLogin(router);
         }
      };

      checkAuth();
   }, [pathname, router, loading]);

   return children;
};

export default AuthGuard;

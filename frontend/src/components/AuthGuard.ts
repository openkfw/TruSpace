"use client";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
   deleteLoginCookie,
   getLoginCookie,
   isTokenExpired,
   redirectToLogin
} from "../lib";

const AuthGuard = ({ children }) => {
   const router = useRouter();
   const pathname = usePathname();

   useEffect(() => {
      // Define public paths that don't require authentication
      const publicPaths = ["/login", "/register", "/forgot-password"];

      const checkAuth = () => {
         const loginData = Cookies.get("login");

         // If no login data and current path isn't public, redirect to login
         if (!loginData && !publicPaths.includes(pathname)) {
            redirectToLogin(router);
            return;
         }

         if (publicPaths.includes(pathname)) {
            return;
         }

         try {
            const loginCookie = getLoginCookie();

            if (isTokenExpired(loginCookie)) {
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
                     deleteLoginCookie();
                     redirectToLogin(router);
                  }, timeUntilExpiry);

                  // Clear the timeout if component unmounts
                  return () => clearTimeout(expiryTimer);
               }
            }
         } catch (error) {
            console.error("Error parsing auth data:", error);
            deleteLoginCookie();
            redirectToLogin(router);
         }
      };

      checkAuth();
   }, [pathname, router]);

   return children;
};

export default AuthGuard;

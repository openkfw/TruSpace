"use client";

import {
   deleteLoginCookie,
   getLoginCookie,
   isTokenExpired,
   redirectToLogin
} from "@/lib";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Root() {
   const router = useRouter();

   useEffect(() => {
      const loginCookie = getLoginCookie();
      if (loginCookie) {
         if (isTokenExpired(loginCookie)) {
            deleteLoginCookie();
            redirectToLogin(router);
         } else {
            router.push("/home");
         }
      } else {
         redirectToLogin(router);
      }
   }, [router]);

   return null;
}

"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import {
   deleteLoginCookie,
   getLoginCookie,
   isTokenExpired,
   redirectToLogin
} from "@/lib";

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

"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useUser } from "@/contexts/UserContext";
import { redirectToLogin } from "@/lib";

export default function Root() {
   const router = useRouter();
   const { isLoggedIn } = useUser();

   useEffect(() => {
      if (isLoggedIn) {
         router.push("/home");
      } else {
         redirectToLogin(router);
      }
   }, [router]);

   return null;
}

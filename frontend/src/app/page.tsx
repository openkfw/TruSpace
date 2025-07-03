"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useUser } from "@/contexts/UserContext";

export default function Root() {
   const router = useRouter();
   const { isLoggedIn } = useUser();

   useEffect(() => {
      if (isLoggedIn) {
         router.push("/home");
      } else {
         router.push("/login");
      }
   }, [router]);

   return null;
}

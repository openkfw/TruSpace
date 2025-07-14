"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useUser } from "@/contexts/UserContext";

export default function Root() {
   const router = useRouter();
   const { isLoggedIn, loading } = useUser();
   const generalTranslations = useTranslations("general");

   useEffect(() => {
      if (!loading) {
         if (isLoggedIn) {
            router.push("/home");
         } else {
            router.push("/login");
         }
      }
   }, [isLoggedIn, loading, router]);

   if (loading) {
      return <p>{generalTranslations("loading")}</p>;
   }

   return null;
}

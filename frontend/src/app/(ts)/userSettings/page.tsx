"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginCookie } from "@/lib";

export default function UserSettings() {
   const [loggedUser, setLoggedUser] = useState(null);
   const registerTranslations = useTranslations("register");
   const generalTranslations = useTranslations("general");

   useEffect(() => {
      const userData = getLoginCookie();
      const initials = userData.name
         .split(" ")
         .map((n) => n[0])
         .join("")
         .slice(0, 2)
         .toUpperCase();
      setLoggedUser({ ...userData, initials });
   }, []);

   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleAvatarClick = () => {
      fileInputRef.current?.click();
   };

   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const avatar = URL.createObjectURL(file);
         setLoggedUser((prev) => ({ ...prev, avatar }));
      }
   };

   const onSubmit = () => {
      // Handle form submission logic here
      console.log("User settings saved:", loggedUser);
   };

   return (
      <div className="max-w-md mx-auto mt-16 p-6 space-y-8">
         <div className="flex flex-col items-center gap-3">
            <Button
               variant="ghost"
               onClick={handleAvatarClick}
               aria-label="Upload avatar"
               className="relative hover:bg-transparent"
            >
               <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-800 shadow-md transition hover:opacity-90 hover:border-slate-300 dark:hover:border-gray-500">
                  <AvatarImage
                     src={loggedUser?.avatar}
                     alt="User avatar"
                     className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-medium bg-muted text-muted-foreground">
                     {loggedUser?.initials}
                  </AvatarFallback>
               </Avatar>
            </Button>
            <Input
               type="file"
               accept="image/*"
               ref={fileInputRef}
               onChange={handleAvatarChange}
               className="hidden"
            />
            <p className="mt-6 text-sm text-muted-foreground">
               {generalTranslations("uploadAvatar")}
            </p>
         </div>

         <div className="space-y-4">
            <div>
               <Label htmlFor="name">{registerTranslations("name")}</Label>
               <Input
                  id="name"
                  className="p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                  defaultValue={loggedUser?.name}
                  disabled
               />
            </div>
            <div>
               <Label htmlFor="email">{registerTranslations("email")}</Label>
               <Input
                  id="email"
                  type="email"
                  className="p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                  defaultValue={loggedUser?.email}
                  disabled
               />
            </div>
            <Button type="submit" onClick={onSubmit} className="w-full">
               {generalTranslations("saveSettings")}
            </Button>
         </div>
      </div>
   );
}

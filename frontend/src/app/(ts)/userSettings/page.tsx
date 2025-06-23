"use client";

import { useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { uploadAvatar } from "@/lib/services";

export default function UserSettings() {
   const { user, loading, updateAvatar } = useUser();
   const [file, setFile] = useState<File>();
   const registerTranslations = useTranslations("register");
   const generalTranslations = useTranslations("general");

   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleAvatarClick = () => {
      fileInputRef.current?.click();
   };

   const handleAvatarChange = async (
      e: React.ChangeEvent<HTMLInputElement>
   ) => {
      const file = e.target.files?.[0];
      if (file) {
         const avatar = URL.createObjectURL(file);
         setFile(file);
         updateAvatar(avatar);
      }
   };

   const handleSubmit = async () => {
      // TODO when appropriate add other fields, updateUser instead of uploadAvatar
      try {
         const formData = new FormData();
         formData.append("file", file, file.name);
         await uploadAvatar(formData);
         console.log("User settings saved:", user);
      } catch (err) {
         console.error("Updating user failed: ", err);
      }
   };

   if (loading || !user) return <div>{generalTranslations("loading")}</div>;

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
                     src={user.avatar}
                     alt="User avatar"
                     className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-medium bg-muted text-muted-foreground">
                     {user.initials}
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
                  defaultValue={user.name}
                  disabled
               />
            </div>
            <div>
               <Label htmlFor="email">{registerTranslations("email")}</Label>
               <Input
                  id="email"
                  type="email"
                  className="p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                  defaultValue={user.email}
                  disabled
               />
            </div>
            <Button type="submit" onClick={handleSubmit} className="w-full">
               {generalTranslations("saveSettings")}
            </Button>
         </div>
      </div>
   );
}

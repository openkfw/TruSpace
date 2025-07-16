"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue
} from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { updateUserSettings } from "@/lib/services";

export default function UserSettings() {
   const { user, loading, updatePreferedLanguage, updateAvatar, refreshUser } =
      useUser();
   const [file, setFile] = useState<File>();
   const [selectedLanguage, setSelectedLanguage] = useState<string>();
   const [notificationAddedToWorkspace, setNotificationAddedToWorkspace] =
      useState<boolean>(false);
   const [notificationDocumentChanged, setNotificationDocumentChanged] =
      useState<boolean>(false);
   const [notificationDocumentChat, setNotificationDocumentChat] =
      useState<boolean>();
   const [notificationWorkspaceChange, setNotificationWorkspaceChange] =
      useState<boolean>(false);
   const [settingChanged, setSettingChanged] = useState<boolean>(false);

   useEffect(() => {
      if (user) {
         if (user.settings?.preferedLanguage) {
            setSelectedLanguage(user.settings?.preferedLanguage);
         }
         setNotificationAddedToWorkspace(
            user.settings?.notificationSettings?.addedToWorkspace || false
         );
         setNotificationDocumentChanged(
            user.settings?.notificationSettings?.documentChanged || false
         );
         setNotificationDocumentChat(
            user.settings?.notificationSettings?.documentChat || false
         );
         setNotificationWorkspaceChange(
            user.settings?.notificationSettings?.workspaceChange || false
         );
      }
   }, [user]);
   const registerTranslations = useTranslations("register");
   const generalTranslations = useTranslations("general");
   const settingsTranslations = useTranslations("settings");

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
         setSettingChanged(true);
      }
   };

   const handlePreferedLanguageChange = (language) => {
      setSelectedLanguage(language);
      setSettingChanged(true);
   };

   const handleSubmit = async () => {
      if (!settingChanged) {
         toast.info(settingsTranslations("noChanges"));
         return;
      }
      try {
         const formData = new FormData();
         if (file) {
            formData.append("file", file, file.name);
         }
         formData.append("preferedLanguage", selectedLanguage);
         formData.append(
            "notificationAddedToWorkspace",
            String(notificationAddedToWorkspace)
         );
         formData.append(
            "notificationDocumentChanged",
            String(notificationDocumentChanged)
         );
         formData.append(
            "notificationDocumentChat",
            String(notificationDocumentChat)
         );
         formData.append(
            "notificationWorkspaceChange",
            String(notificationWorkspaceChange)
         );
         updatePreferedLanguage(selectedLanguage);
         await updateUserSettings(formData);
         refreshUser();
         toast.success(settingsTranslations("updateSuccess"));
         setFile(null);
      } catch (err) {
         console.error("Updating user failed: ", err);
         toast.error(settingsTranslations("updateError"));
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
            <div>
               <Label htmlFor="email">
                  {settingsTranslations("preferedLanguage")}
               </Label>
               <Select
                  value={selectedLanguage}
                  onValueChange={handlePreferedLanguageChange}
               >
                  <SelectTrigger className="w-[50%] bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {[
                        { key: "en", label: "English" },
                        { key: "de", label: "Deutsch" }
                     ].map((language) => (
                        <SelectItem key={language.key} value={language.key}>
                           {language.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>
         <div className="space-y-2">
            <h3>{settingsTranslations("notificationSettings")}</h3>
            <p className="text-xs text-muted-foreground mb-2">
               {settingsTranslations("notificationSettingsDescription")}
            </p>
            <div>
               <Checkbox
                  id="notificationAddedToWorkspace"
                  checked={notificationAddedToWorkspace}
                  onCheckedChange={(checked) => {
                     setNotificationAddedToWorkspace(!!checked);
                     setSettingChanged(true);
                  }}
                  className="mr-2"
               />
               <Label htmlFor="notificationAddedToWorkspace">
                  {settingsTranslations("notificationAddedToWorkspace")}
               </Label>
            </div>
            <div>
               <Checkbox
                  id="notificationDocumentChanged"
                  checked={notificationDocumentChanged}
                  onCheckedChange={(checked) => {
                     setNotificationDocumentChanged(!!checked);
                     setSettingChanged(true);
                  }}
                  className="mr-2"
               />
               <Label htmlFor="notificationDocumentChanged">
                  {settingsTranslations("notificationDocumentChanged")}
               </Label>
            </div>
            <div>
               <Checkbox
                  id="notificationDocumentChat"
                  checked={notificationDocumentChat}
                  onCheckedChange={(checked) => {
                     setNotificationDocumentChat(!!checked);
                     setSettingChanged(true);
                  }}
                  className="mr-2"
               />
               <Label htmlFor="notificationDocumentChat">
                  {settingsTranslations("notificationDocumentChat")}
               </Label>
            </div>
            <div>
               <Checkbox
                  id="notificationWorkspaceChange"
                  checked={notificationWorkspaceChange}
                  onCheckedChange={(checked) => {
                     setNotificationWorkspaceChange(!!checked);
                     setSettingChanged(true);
                  }}
                  className="mr-2"
               />
               <Label htmlFor="notificationWorkspaceChange">
                  {settingsTranslations("notificationWorkspaceChanged")}
               </Label>
            </div>
         </div>
         <div className="space-y-2">
            <Button type="submit" onClick={handleSubmit} className="w-full">
               {generalTranslations("saveSettings")}
            </Button>
         </div>
      </div>
   );
}

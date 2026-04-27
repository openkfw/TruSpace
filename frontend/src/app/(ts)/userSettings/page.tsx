"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger
} from "@/components/ui/dialog";
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
import {
   deleteUser,
   loginUser,
   removeAllUserPermissions,
   updateUserSettings,
   updateUserName
} from "@/lib/services";

export default function UserSettings() {
   const {
      user,
      loading,
      logout,
      updatePreferedLanguage,
      updateUser,
      updateAvatar,
      refreshUser
   } = useUser();
   const [file, setFile] = useState<File>();
   const [selectedLanguage, setSelectedLanguage] = useState<string>();
   const [notificationAddedToWorkspace, setNotificationAddedToWorkspace] =
      useState<boolean>(false);
   const [
      notificationRemovedFromWorkspace,
      setNotificationRemovedFromWorkspace
   ] = useState<boolean>(false);
   const [notificationDocumentChanged, setNotificationDocumentChanged] =
      useState<boolean>(false);
   const [notificationDocumentChat, setNotificationDocumentChat] =
      useState<boolean>();
   const [notificationWorkspaceChange, setNotificationWorkspaceChange] =
      useState<boolean>(false);
   const [settingChanged, setSettingChanged] = useState<boolean>(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
   const [deletePassword, setDeletePassword] = useState<string>("");
   const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

   useEffect(() => {
      if (user) {
         if (user.settings?.preferedLanguage) {
            setSelectedLanguage(user.settings?.preferedLanguage);
         }
         setNotificationAddedToWorkspace(
            user.settings?.notificationSettings?.addedToWorkspace || false
         );
         setNotificationRemovedFromWorkspace(
            user.settings?.notificationSettings?.removedFromWorkspace || false
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

   const handleNameChange = async (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        const name = e.currentTarget.value;

        if (user && name !== user.name) {
            updateUser({ name });
            await updateUserName(name);
            setSettingChanged(true);
        }
    }

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
            "notificationRemovedFromWorkspace",
            String(notificationRemovedFromWorkspace)
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
         setSettingChanged(false);
      } catch (err) {
         console.error("Updating user failed: ", err);
         toast.error(settingsTranslations("updateError"));
      }
   };

   const handleDeleteUser = async (
      event: React.FormEvent<HTMLFormElement>
   ) => {
      event.preventDefault();

      if (!user?.email) {
         return;
      }

      if (!deletePassword) {
         toast.error(settingsTranslations("deleteUserPasswordRequired"));
         return;
      }

      setIsDeletingUser(true);
      try {
         const loginResult = await loginUser({
            email: user.email,
            password: deletePassword
         });

         if (loginResult?.status !== "success") {
            toast.error(settingsTranslations("deleteUserPasswordInvalid"));
            return;
         }

         await removeAllUserPermissions(user.email);
         await deleteUser();

         setDeleteDialogOpen(false);
         setDeletePassword("");
         toast.success(settingsTranslations("deleteUserSuccess"));
         await logout();
      } catch (err) {
         console.error("Deleting user failed: ", err);
         toast.error(settingsTranslations("deleteUserError"));
      } finally {
         setIsDeletingUser(false);
      }
   };

   if (loading || !user) return <div>{generalTranslations("loading")}</div>;

   return (
      <div className="max-w-md mx-auto mt-16 p-6 space-y-6">
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
                  type="text"
                  className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                  defaultValue={user.name}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNameChange(e);
                    }
                  }}
               />
            </div>
            <div>
               <Label htmlFor="email">{registerTranslations("email")}</Label>
               <Input
                  id="email"
                  type="email"
                  className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
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
                  <SelectTrigger className="mt-1 w-[50%] bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
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
                  id="notificationRemovedFromWorkspace"
                  checked={notificationRemovedFromWorkspace}
                  onCheckedChange={(checked) => {
                     setNotificationRemovedFromWorkspace(!!checked);
                     setSettingChanged(true);
                  }}
                  className="mr-2"
               />
               <Label htmlFor="notificationRemovedFromWorkspace">
                  {settingsTranslations("notificationRemovedFromWorkspace")}
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
         <div className="space-y-4">
            <Button type="submit" onClick={handleSubmit} className="w-full">
               {generalTranslations("saveSettings")}
            </Button>

            <Dialog
               open={deleteDialogOpen}
               onOpenChange={(open) => {
                  if (!open) {
                     setDeletePassword("");
                  }
                  setDeleteDialogOpen(open);
               }}
            >
               <DialogTrigger asChild>
                  <Button
                     type="button"
                     variant="outline"
                     className="w-full border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white"
                  >
                     {settingsTranslations("deleteUserButton")}
                  </Button>
               </DialogTrigger>
               <DialogContent
                  className="sm:max-w-md"
                  onEscapeKeyDown={(e) => e.preventDefault()}
                  onInteractOutside={(e) => e.preventDefault()}
               >
                  <DialogHeader>
                     <DialogTitle>
                        {settingsTranslations("deleteUserDialogTitle")}
                     </DialogTitle>
                  </DialogHeader>
                  <DialogDescription>
                     {settingsTranslations("deleteUserDialogDescription")}
                  </DialogDescription>
                  <form onSubmit={handleDeleteUser}>
                     <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                           <Label htmlFor="deleteUserPassword">
                              {settingsTranslations("deleteUserPasswordLabel")}
                           </Label>
                           <Input
                              id="deleteUserPassword"
                              type="password"
                              value={deletePassword}
                              onChange={(e) =>
                                 setDeletePassword(e.target.value)
                              }
                              placeholder={settingsTranslations(
                                 "deleteUserPasswordPlaceholder"
                              )}
                           />
                        </div>
                     </div>
                     <DialogFooter>
                        <Button
                           type="submit"
                           className="w-full bg-red-600 text-white hover:bg-red-700"
                           disabled={isDeletingUser}
                        >
                           {isDeletingUser
                              ? generalTranslations("loading")
                              : settingsTranslations("deleteUserConfirm")}
                        </Button>
                     </DialogFooter>
                  </form>
               </DialogContent>
            </Dialog>
         </div>
      </div>
   );
}

"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceContext } from "@/contexts/WorkspaceContext";
import {
   deleteUserPermission,
   getUsersInWorkspace,
   postPermission
} from "@/lib/services";
import { validateEmail } from "@/lib/validateEmail";
import { LockOpen, UserCircle, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function WorkspaceShare() {
   const [users, setUsers] = useState([]);
   const { workspaceId } = useParams();
   const { workspace } = useContext(WorkspaceContext);
   const {
      register,
      handleSubmit,
      formState: { errors },
      reset
   } = useForm();
   const translations = useTranslations("shareWorkspace");
   const t = useTranslations("register");

   useEffect(() => {
      const loadUsersInWorkspace = async () => {
         const usersInWorkspace = await getUsersInWorkspace(workspaceId);
         setUsers(usersInWorkspace);
      };
      loadUsersInWorkspace();
   }, [workspaceId]);

   const emailValidation = register("email", {
      required: t("emailRequired"),
      validate: (value) => {
         if (!validateEmail(value)) return t("emailPattern");
         if (
            users.some(
               (user) => user.email.toLowerCase() === value.toLowerCase()
            )
         ) {
            return translations("collaboratorAlreadyExists");
         }
         return true;
      }
   });

   const addUser = async (data: any) => {
      data.workspaceId = workspaceId;
      try {
         await postPermission(data);
         const usersInWorkspace = await getUsersInWorkspace(workspaceId);
         setUsers(usersInWorkspace);
         reset();
      } catch (error) {
         console.log(error);
      }
   };

   const removeUser = async (id: number) => {
      try {
         await deleteUserPermission(id);
         const updatedUsers = users.filter((user) => user.id !== id);
         setUsers(updatedUsers);
      } catch (error) {
         console.log(error);
      }
   };

   return (
      <div>
         <div className="items-center mt-2 text-center">
            {workspace?.meta?.is_public ? (
               <LockOpen className="w-16 h-16 mx-auto mt-10" />
            ) : (
               <Users className="w-16 h-16 mx-auto mt-10" />
            )}
            <h2 className="text-xl font-bold">
               {workspace?.meta?.is_public
                  ? translations("publicWorkspaceTitle")
                  : translations("title")}
            </h2>
            <form className="mt-4" onSubmit={handleSubmit(addUser)}>
               <div className="flex items-start gap-2">
                  <div className="flex flex-col flex-grow">
                     <Input
                        type="text"
                        id="email"
                        {...emailValidation}
                        placeholder={translations("inputPlaceholder")}
                        className="p-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                        disabled={workspace?.meta?.is_public}
                     />
                     {errors.email?.message && (
                        <p className="mt-1 text-red-500 text-sm text-left">
                           {String(errors.email.message)}
                        </p>
                     )}
                  </div>
                  <Button
                     type="submit"
                     className="whitespace-nowrap"
                     disabled={workspace?.meta?.is_public}
                  >
                     {translations("addButton")}
                  </Button>
               </div>
            </form>
         </div>
         <div className="items-center mt-12 mb-2 text-center">
            <p>{translations("listOfCollaborators")}</p>
         </div>
         <div className="grid grid-cols-2 gap-2">
            {users.map((user) => (
               <div
                  key={user.email}
                  className="flex items-center space-x-4 rounded-md border p-4 bg-blue-200 dark:bg-gray-700"
               >
                  <UserCircle />
                  <div className="flex-1 space-y-1">
                     <p className="text-sm font-medium leading-none">
                        {user.name || "n/a"}
                     </p>
                     <p className="text-sm text-muted-foreground">
                        {user.email}
                     </p>
                     <p className="text-sm text-muted-foreground">
                        {user.role}
                     </p>
                  </div>
                  {user.role !== "owner" ? (
                     <Button
                        variant="ghost"
                        onClick={() => removeUser(user.id)}
                     >
                        <X />
                     </Button>
                  ) : null}
               </div>
            ))}
         </div>
      </div>
   );
}

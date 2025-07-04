"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Loader2 } from "lucide-react";

import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { updateWorkspaceType } from "@/lib/services";

import { Button } from "./ui/button";

interface WorkspaceTypeDialogProps {
   open: boolean;
   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
   wUID: string;
}

export default function WorkspaceTypeDialog({
   open,
   setOpen,
   wUID
}: WorkspaceTypeDialogProps) {
   const translations = useTranslations("navbar");
   const { refresh, workspace } = useWorkspaceContext();
   const { user } = useUser();
   const [isUpdating, setIsUpdating] = useState(false);

   const handleConfirmUpdate = async () => {
      if (!wUID) return;
      setIsUpdating(true);
      const formData: { email: string; isPublic: boolean } = {
         email: user?.email,
         isPublic: !workspace?.meta?.is_public
      };

      try {
         await updateWorkspaceType(wUID, formData, "Update failed.");
         toast.success(
            translations("workspaceTypeDialog.workspaceTypeUpdated")
         );
         refresh("");
      } catch (err) {
         console.error("Error updating workspace type:", err);
         toast.error(
            translations("workspaceTypeDialog.workspaceTypeUpdateError")
         );
      } finally {
         setIsUpdating(false);
         setOpen(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
         <DialogContent
            className="sm:max-w-lg"
            onInteractOutside={(e) => e.preventDefault()}
         >
            <DialogHeader>
               <DialogTitle>
                  {workspace?.meta?.is_public
                     ? translations("workspaceTypeDialog.privateDialogTitle")
                     : translations("workspaceTypeDialog.publicDialogTitle")}
               </DialogTitle>
            </DialogHeader>
            <DialogDescription>
               {workspace?.meta?.is_public
                  ? translations(
                       "workspaceTypeDialog.updatePrivateWorkspaceTitle"
                    )
                  : translations(
                       "workspaceTypeDialog.updatePublicWorkspaceTitle"
                    )}
            </DialogDescription>

            <DialogFooter className="flex flex-row justify-between space-x-4">
               <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpen(false)}
               >
                  {translations(
                     "workspaceTypeDialog.cancelWorkspaceTypeUpdate"
                  )}
               </Button>
               <Button type="submit" onClick={handleConfirmUpdate}>
                  {isUpdating ? (
                     <>
                        <Loader2 className="animate-spin" />
                        {translations("workspaceTypeDialog.updating")}
                     </>
                  ) : (
                     translations(
                        "workspaceTypeDialog.confirmWorkspaceTypeUpdate"
                     )
                  )}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

"use client";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { deleteWorkspace } from "@/lib/services";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Button } from "./ui/button";

import { Workspace } from "@/interfaces";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

interface WorkspaceDialogProps {
   open: boolean;
   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
   wCID: string;
   wUID: string;
   setWorkspaces?: React.Dispatch<React.SetStateAction<Workspace[]>>;
}

export default function DeleteWorkspaceDialog({
   open,
   setOpen,
   wCID,
   wUID,
   setWorkspaces
}: WorkspaceDialogProps) {
   const translations = useTranslations("navbar");
   const router = useRouter();
   const { refresh } = useWorkspaceContext();

   const [isDeleting, setIsDeleting] = useState(false);

   const handleConfirmDeletion = async () => {
      if (!wCID || !wUID) return;
      setIsDeleting(true);

      try {
         await deleteWorkspace(wCID, wUID, "Deletion failed.");
         setWorkspaces((prev) => prev.filter((w) => w.cid !== wCID));
         toast.success(
            translations("workspaceDeletionDialog.workspaceDeleted")
         );
         router.replace("/dashboard");
         refresh("");
      } catch (err) {
         console.error("Error deleting workspace:", err);
         toast.error(
            translations("workspaceDeletionDialog.workspaceDeletionFailed")
         );
      } finally {
         setIsDeleting(false);
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
               <DialogTitle>{translations("deleteWorkspace")}</DialogTitle>
            </DialogHeader>
            <DialogDescription>
               {translations(
                  "workspaceDeletionDialog.confirmWorkspaceDeletion"
               )}
            </DialogDescription>

            <DialogFooter className="flex flex-row justify-between space-x-4">
               <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpen(false)}
               >
                  {translations(
                     "workspaceDeletionDialog.cancelButtonWorkspaceDeletion"
                  )}
               </Button>
               <Button type="submit" onClick={handleConfirmDeletion}>
                  {isDeleting ? (
                     <>
                        <Loader2 className="animate-spin" />
                        {translations("workspaceDeletionDialog.deleting")}
                     </>
                  ) : (
                     translations(
                        "workspaceDeletionDialog.confirmButtonWorkspaceDeletion"
                     )
                  )}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

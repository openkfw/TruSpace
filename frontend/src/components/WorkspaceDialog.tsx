"use client";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { createWorkspace } from "@/lib/services";
import { CircleHelp, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Checkbox } from "./ui/checkbox";
import {
   Tooltip,
   TooltipProvider,
   TooltipTrigger,
   TooltipContent
} from "@/components/ui/tooltip";
import { isTouchDevice } from "@/lib/utils";

interface WorkspaceDialogProps {
   open: boolean;
   setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function WorkspaceDialog({
   open,
   setOpen
}: WorkspaceDialogProps) {
   const [isUploading, setIsUploading] = useState(false);
   const [newWorkspaceName, setNewWorkspaceName] = useState("");
   const [newWorkspaceIsPrivate, setNewWorkspaceIsPrivate] = useState(false);
   const [pendingWorkspaceName, setPendingWorkspaceName] = useState<
      string | null
   >(null);
   const { refresh, availableWorkspaces } = useWorkspaceContext();
   const [validationError, setValidationError] = useState("");
   const [tooltipOpen, setTooltipOpen] = useState(false);
   const translations = useTranslations("navbar");
   const router = useRouter();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUploading(true);
      setValidationError("");
      const formData = {
         name: newWorkspaceName,
         isPublic: !newWorkspaceIsPrivate
      };

      try {
         const res = await createWorkspace(formData, "Upload failed");
         if (res.status === 409) {
            setValidationError(translations("workspaceDialog.nameExists"));
            return;
         }
         setNewWorkspaceName("");
         setOpen(false);
         setPendingWorkspaceName(newWorkspaceName);
         refresh(newWorkspaceName);
         toast.success(translations("workspaceDialog.workspaceCreated"));
         router.refresh();
      } catch (err) {
         console.error(err);
         setValidationError(translations("workspaceDialog.error"));
         toast.error(translations("workspaceDialog.workspaceCreateError"));
      } finally {
         setIsUploading(false);
      }
   };

   useEffect(() => {
      if (pendingWorkspaceName && availableWorkspaces) {
         const foundWorkspace = availableWorkspaces.find(
            (workspace) => workspace.meta?.name === pendingWorkspaceName
         );

         if (foundWorkspace) {
            setPendingWorkspaceName(null);
            router.push(`/workspace/${foundWorkspace.uuid}`);
         }
      }
   }, [availableWorkspaces, pendingWorkspaceName, router]);

   const handleTooltipClick = () => {
      if (isTouchDevice()) {
         setTooltipOpen((prev) => !prev);
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
                  {translations("workspaceDialog.addWorkspace")}
               </DialogTitle>
            </DialogHeader>
            <DialogDescription />
            <form onSubmit={handleSubmit}>
               <div className="grid gap-4 py-4">
                  <div>
                     <Label htmlFor="workspace">
                        {translations("workspaceDialog.workspaceName")}
                     </Label>
                     <Input
                        className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                        id="workspace-input"
                        type="text"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder={translations(
                           "workspaceDialog.namePlaceholder"
                        )}
                        required
                        maxLength={50}
                     />
                     <div className="flex flex-row items-center mt-4">
                        <Checkbox
                           checked={newWorkspaceIsPrivate}
                           onCheckedChange={() =>
                              setNewWorkspaceIsPrivate(!newWorkspaceIsPrivate)
                           }
                           className="mr-2"
                        />
                        <span className="mr-2">
                           {translations("workspaceDialog.setPrivate")}
                        </span>
                        <TooltipProvider>
                           <Tooltip
                              open={tooltipOpen}
                              onOpenChange={setTooltipOpen}
                           >
                              <TooltipTrigger asChild>
                                 <CircleHelp
                                    onClick={handleTooltipClick}
                                    className="text-muted-foreground h-5 w-5 cursor-pointer hover:text-primary transition-colors"
                                 />
                              </TooltipTrigger>
                              <TooltipContent
                                 className="text-sm shadow-md max-w-xs p-3 rounded-md"
                                 sideOffset={8}
                              >
                                 {translations("workspaceDialog.workspaceHint")}
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     </div>
                     {validationError && (
                        <p className="mt-2 text-sm text-red-500">
                           {validationError}
                        </p>
                     )}
                  </div>
               </div>
               <DialogFooter className="flex flex-row justify-between space-x-4">
                  <Button
                     className="w-1/2 sm:w-auto"
                     type="button"
                     variant="destructive"
                     onClick={() => setOpen(false)}
                  >
                     {translations("workspaceDialog.cancel")}
                  </Button>
                  <Button
                     disabled={isUploading}
                     type="submit"
                     className="w-1/2 sm:w-auto"
                  >
                     {isUploading ? (
                        <>
                           <Loader2 className="animate-spin" />
                           {translations("workspaceDialog.adding")}
                        </>
                     ) : (
                        translations("workspaceDialog.add")
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

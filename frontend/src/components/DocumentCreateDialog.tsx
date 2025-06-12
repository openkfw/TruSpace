"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { documentUpload } from "@/lib/services";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface DocumentCreateDialogProps {
   open?: boolean;
   setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DocumentCreateDialog({
   open,
   setOpen
}: DocumentCreateDialogProps) {
   const [isCreating, setIsCreating] = useState(false);
   const { workspace } = useWorkspaceContext();
   const { fetchDocuments } = useDocuments();
   const [documentName, setDocumentName] = useState("");
   const translations = useTranslations("homePage");
   const documentTranslations = useTranslations("document");

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);
      const formData = new FormData();
      formData.append("workspace", workspace?.uuid);
      const blob = new Blob([""], { type: "application/json" });
      formData.append("file", blob, `${documentName}.editableFile`);

      try {
         await documentUpload(formData, null, translations("uploadError"));
         await fetchDocuments(workspace?.uuid);
         setDocumentName("");
         setOpen(false);
      } catch (err) {
         console.error(err);
         toast.error(documentTranslations("documentCreateError"));
      } finally {
         setIsCreating(false);
         toast.success(documentTranslations("documentCreated"));
      }
   };

   const uploadButtonTitle = translations("create");
   const uploadDialogTitle = translations("createDocumentTitle");

   return (
      <>
         <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogContent
               className="sm:max-w-lg"
               onEscapeKeyDown={(e) => e.preventDefault()}
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>{uploadDialogTitle}</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                     <div>
                        <Label htmlFor="author">
                           {translations("documentName")}
                        </Label>
                        <Input
                           className="mt-2 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white"
                           id="documentName"
                           type="text"
                           value={documentName}
                           onChange={(e) => setDocumentName(e.target.value)}
                           placeholder={translations("documentNamePlaceholder")}
                           required
                        />
                     </div>
                  </div>
                  <DialogFooter className="flex flex-row justify-between space-x-4">
                     <Button
                        className="w-1/2 sm:w-auto"
                        type="button"
                        variant="destructive"
                        onClick={() => setOpen(false)}
                     >
                        {translations("cancel")}
                     </Button>
                     <Button
                        disabled={isCreating}
                        type="submit"
                        className="w-1/2 sm:w-auto"
                     >
                        {isCreating ? (
                           <>
                              <Loader2 className="animate-spin" />
                              {translations("creating")}
                           </>
                        ) : (
                           uploadButtonTitle
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>
      </>
   );
}

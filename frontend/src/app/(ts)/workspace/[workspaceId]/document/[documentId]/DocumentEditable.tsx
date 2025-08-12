"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Loader2 } from "lucide-react";

import Editor from "@/components/tiptap-editor/Editor";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger
} from "@/components/ui/dialog";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { documentUpload, loadDocumentBlob } from "@/lib/services";

export default function DocumentEditable({
   cid,
   docId,
   filename
}: {
   cid: string;
   docId: string;
   filename: string;
}) {
   const translations = useTranslations("documentEditable");
   const { workspace } = useWorkspaceContext();
   const { fetchDocumentDetails } = useDocuments();
   const [editorContent, setEditorContent] = useState(null);
   const [loadedEditorContent, setLoadedEditorContent] = useState(null);

   const [open, setOpen] = useState(false);
   const [isUploading, setIsUploading] = useState(false);

   useEffect(() => {
      const loadFile = async () => {
         const docx = await loadDocumentBlob(cid);
         // convert Blob to string
         const reader = new FileReader();
         reader.onload = function () {
            const editorContentString = reader.result;
            setLoadedEditorContent(editorContentString || []);
         };

         reader.readAsText(docx);
      };
      loadFile();
   }, [cid]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setIsUploading(true);
      const formData = new FormData();
      formData.append("workspace", workspace?.uuid);
      formData.append("versionTagName", "");

      const editorContentBlob = new Blob([editorContent], {
         type: "text/html"
      });
      formData.append("file", editorContentBlob, filename);

      try {
         await documentUpload(formData, docId, translations("uploadError"));
         setOpen(false);
      } catch (err) {
         console.error(err);
      } finally {
         fetchDocumentDetails(docId);
         setIsUploading(false);
      }
   };

   return (
      loadedEditorContent && (
         <div>
            <Editor
               content={loadedEditorContent}
               onChange={(editor) => setEditorContent(editor.getHTML())}
               stickyToolbarTopMargin="12"
            />
            <div className="flex justify-end items-center mt-4">
               <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
                  <DialogTrigger asChild>
                     <Button>{translations("save")}</Button>
                  </DialogTrigger>
                  <DialogContent
                     className="sm:max-w-lg"
                     onEscapeKeyDown={(e) => e.preventDefault()}
                     onInteractOutside={(e) => e.preventDefault()}
                  >
                     <DialogHeader>
                        <DialogTitle>
                           {translations("saveNewVersion")}
                        </DialogTitle>
                     </DialogHeader>
                     <DialogDescription />
                     <form onSubmit={handleSubmit}>
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
                              disabled={isUploading}
                              type="submit"
                              className="w-1/2 sm:w-auto"
                           >
                              {isUploading ? (
                                 <>
                                    <Loader2 className="animate-spin" />
                                    {translations("uploading")}
                                 </>
                              ) : (
                                 translations("save")
                              )}
                           </Button>
                        </DialogFooter>
                     </form>
                  </DialogContent>
               </Dialog>
            </div>
            <div className="h-24" />
         </div>
      )
   );
}

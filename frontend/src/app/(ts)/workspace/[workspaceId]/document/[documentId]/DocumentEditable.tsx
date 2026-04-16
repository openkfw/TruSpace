"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Loader2 } from "lucide-react";

import IPFSLoader from "@/components/IPFSLoader";
import Editor from "@/components/tiptap-editor/Editor";
import { Button } from "@/components/ui/button";

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
      } catch (err) {
         console.error(err);
      } finally {
         fetchDocumentDetails(docId);
         setIsUploading(false);
      }
   };

   return loadedEditorContent ? (
      <div className="pb-[var(--chat-offset)]">
         <div className="flex justify-end items-center mt-4">
            <Button
               disabled={isUploading}
               type="button"
               className="w-1/2 sm:w-auto"
               onClick={handleSubmit}
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
         </div>
         <Editor
            content={loadedEditorContent}
            onChange={(editor) => setEditorContent(editor.getHTML())}
            stickyToolbarTopMargin="12"
         />

      </div>
   ) : (
      <IPFSLoader />
   );
}

"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { ChevronDown, Loader2 } from "lucide-react";
import TurndownService from "turndown";

import IPFSLoader from "@/components/IPFSLoader";
import Editor from "@/components/tiptap-editor/Editor";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { documentUpload, loadDocumentBlob } from "@/lib/services";

const turndownService = new TurndownService();

type ExportFormat = "html" | "markdown";

function withExtension(name: string, extension: string) {
   const dotIndex = name.lastIndexOf(".");
   const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
   return `${base}.${extension}`;
}

async function saveBlobToDisk(blob: Blob, suggestedName: string) {
   const showSaveFilePicker = (window as typeof window & {
      showSaveFilePicker?: (options: unknown) => Promise<{
         createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
         }>;
      }>;
   }).showSaveFilePicker;

   if (showSaveFilePicker) {
      try {
         const handle = await showSaveFilePicker({ suggestedName });
         const writable = await handle.createWritable();
         await writable.write(blob);
         await writable.close();
         return;
      } catch (err) {
         if ((err as { name?: string })?.name === "AbortError") {
            return;
         }
         // Fall through to the anchor-download fallback below.
      }
   }

   const url = URL.createObjectURL(blob);
   const link = document.createElement("a");
   link.href = url;
   link.download = suggestedName;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
}

export default function DocumentEditable({
   cid,
   docId,
   filename,
   initialVersionTagName
}: {
   cid: string;
   docId: string;
   filename: string;
   initialVersionTagName?: string;
}) {
   const translations = useTranslations("documentEditable");
   const { workspace } = useWorkspaceContext();
   const { fetchDocumentDetails } = useDocuments();
   const [editorContent, setEditorContent] = useState(null);
   const [loadedEditorContent, setLoadedEditorContent] = useState(null);

   const [versionTagName, setVersionTagName] = useState(
      initialVersionTagName ?? ""
   );
   const [isUploading, setIsUploading] = useState(false);

   const baseFilename = filename?.endsWith(".editableFile")
      ? filename.slice(0, -".editableFile".length)
      : filename;

   useEffect(() => {
      if (initialVersionTagName && versionTagName === "") {
         setVersionTagName(initialVersionTagName);
      }
   }, [initialVersionTagName, versionTagName]);

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

   const handleExport = async (format: ExportFormat) => {
      const html = editorContent ?? loadedEditorContent;
      if (!html) {
         return;
      }

      try {
         switch (format) {
            case "html": {
               const blob = new Blob([html], { type: "text/html" });
               await saveBlobToDisk(blob, withExtension(baseFilename, "html"));
               break;
            }
            case "markdown": {
               const markdown = turndownService.turndown(html);
               const blob = new Blob([markdown], { type: "text/markdown" });
               await saveBlobToDisk(blob, withExtension(baseFilename, "md"));
               break;
            }
         }
      } catch (err) {
         console.error(err);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setIsUploading(true);
      const formData = new FormData();
      formData.append("workspace", workspace?.uuid);
      formData.append("versionTagName", versionTagName);

      const editorContentBlob = new Blob([editorContent], {
         type: "text/html"
      });
      formData.append("file", editorContentBlob, filename);

      try {
         await documentUpload(formData, docId, translations("uploadError"));
         // A new editable-document version creates a backend activity
         // event; the DocumentChat timeline picks it up via its own SWR
         // polling.
      } catch (err) {
         console.error(err);
      } finally {
         fetchDocumentDetails(docId);
         setIsUploading(false);
      }
   };

   return loadedEditorContent ? (
      <div>
         <div className="flex items-center justify-between gap-4">
            <TooltipProvider>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Input
                        type="text"
                        placeholder={translations("versionTagDefault")}
                        value={versionTagName === "undefined" ? "" : versionTagName}
                        onChange={(e) => setVersionTagName(e.target.value)}
                        className="w-full max-w-xs"
                     />
                  </TooltipTrigger>
                  <TooltipContent>
                     {translations("versionTagTip")}
                  </TooltipContent>
               </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-2">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button type="button" variant="outline">
                        {translations("export")}
                        <ChevronDown />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                     <DropdownMenuItem onClick={() => handleExport("html")}>
                        {translations("exportHtml")}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleExport("markdown")}>
                        {translations("exportMarkdown")}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
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
         </div>
         <Editor
            content={loadedEditorContent}
            onChange={(editor) => setEditorContent(editor.getHTML())}
            stickyToolbarTopMargin="12"
            contentMaxHeightClassName="max-h-[calc(100vh-27rem)]"
         />

      </div>
   ) : (
      <IPFSLoader />
   );
}

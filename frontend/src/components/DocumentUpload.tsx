"use client";
import React, { useRef, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { Loader2, Upload, X } from "lucide-react";
import * as pdfjs from "pdfjs-dist";

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
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { documentUpload } from "@/lib/services";
import { isPdfBlank } from "@/lib/utils";

import { Label } from "./ui/label";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   "pdfjs-dist/build/pdf.worker.min.mjs",
   import.meta.url
).toString();

const MAX_FILE_SIZE_MB = 110;

interface DocumentUploadProps {
   docId?: string;
   open?: boolean;
   setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DocumentUpload({
   docId,
   open,
   setOpen
}: DocumentUploadProps) {
   const [isUploading, setIsUploading] = useState(false);
   const { workspace } = useWorkspaceContext();
   const { fetchDocuments, refreshUntilVersionFound } = useDocuments();
   const [author, setAuthor] = useState("");
   const [defaultAuthor, _setDefaultAuthor] = useState("");
   const [files, setFiles] = useState<File[]>([]);
   const [blankStatuses, setBlankStatuses] = useState<boolean[]>([]);
   const [fileSizeErrors, setFileSizeErrors] = useState<boolean[]>([]);
   const [versionTagName, setVersionTagName] = useState<string>("");

   const inputRef = useRef<HTMLInputElement>(null);

   const translations = useTranslations("homePage");
   const documentTranslations = useTranslations("document");

   const handleFileChange = async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const newFiles = Array.from(fileList);
      const newBlankStatuses: boolean[] = [];
      const newSizeErrors: boolean[] = [];

      // Check for duplicates
      const filteredNewFiles = newFiles.filter((newFile) => {
         return !files.some(
            (existingFile) =>
               existingFile.name === newFile.name &&
               existingFile.size === newFile.size
         );
      });

      if (filteredNewFiles.length === 0) {
         if (inputRef.current) {
            inputRef.current.value = "";
         }
         return;
      }

      const statusPromises = filteredNewFiles.map(async (file, index) => {
         const isTooLarge = file.size > MAX_FILE_SIZE_MB * 1024 * 1024;
         let isBlank = false;

         const fileExtension = file.name.split(".").pop()?.toLowerCase();
         if (fileExtension === "pdf") {
            try {
               isBlank = await isPdfBlank(file, pdfjs);
            } catch (error) {
               console.error(
                  "Error checking PDF content for",
                  file.name,
                  ":",
                  error
               );
               toast.error(documentTranslations("documentUploadError"));
               isBlank = false;
            }
         }

         return {
            file,
            isTooLarge,
            isBlank,
            index
         };
      });

      const results = await Promise.all(statusPromises);

      results.forEach((result) => {
         newSizeErrors.push(result.isTooLarge);
         newBlankStatuses.push(result.isBlank);
      });

      setFiles((prevFiles) => [...prevFiles, ...filteredNewFiles]);
      setBlankStatuses((prevStatuses) => [
         ...prevStatuses,
         ...newBlankStatuses
      ]);
      setFileSizeErrors((prevErrors) => [...prevErrors, ...newSizeErrors]);

      if (inputRef.current) {
         inputRef.current.value = "";
      }
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e.target.files);
   };

   const handleVersionTagNameInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
   ) => {
      setVersionTagName(e.target.value);
   };

   const handleClick = () => {
      inputRef.current?.click();
   };

   const removeFile = (indexToRemove: number) => {
      setFiles(files.filter((_, index) => index !== indexToRemove));
      setBlankStatuses(
         blankStatuses.filter((_, index) => index !== indexToRemove)
      );
      setFileSizeErrors(
         fileSizeErrors.filter((_, index) => index !== indexToRemove)
      );
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUploading(true);

      const uploadPromises = files.map(async (file, idx) => {
         if (
            file &&
            file.name.split(".").pop()?.toLowerCase() === "pdf" &&
            blankStatuses[idx]
         ) {
            toast.error(
               documentTranslations("blankPdfError") + " " + file.name
            );
            return;
         }
         const formData = new FormData();
         formData.append("workspace", workspace?.uuid);
         formData.append("versionTagName", versionTagName);
         formData.append("author", author);
         formData.append("file", file, file.name);
         try {
            const res = await documentUpload(
               formData,
               docId,
               translations("uploadError")
            );
            if (docId) {
               await refreshUntilVersionFound(docId, res.data.cid);
            }
            await fetchDocuments(workspace?.uuid);

            toast.success(
               docId
                  ? documentTranslations("documentVersionUploaded")
                  : documentTranslations("documentUploaded")
            );
         } catch (err) {
            console.error(err);
            toast.error(
               docId
                  ? documentTranslations("documentVersionUploadError")
                  : documentTranslations("documentUploadError")
            );
         }
      });

      await Promise.all(uploadPromises);
      setFiles([]);
      setBlankStatuses([]);
      setFileSizeErrors([]);
      setAuthor(defaultAuthor);
      setOpen(false);
      setIsUploading(false);
      setVersionTagName("");
   };

   const uploadButtonTitle = docId
      ? translations("uploadNewVersion")
      : translations("upload");
   const uploadDialogTitle = docId
      ? translations("uploadNewVersionTitle")
      : translations("uploadDocumentTitle");

   const hasValidationErrors =
      blankStatuses.some(Boolean) || fileSizeErrors.some(Boolean);

   return (
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
                  <div className="flex flex-col">
                     <Label htmlFor="file">
                        {translations("file")}{" "}
                        <span className="text-sm text-muted-foreground">
                           {documentTranslations("maxFileSize")}
                        </span>
                     </Label>
                     <input
                        ref={inputRef}
                        type="file"
                        onChange={handleInputChange}
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                     />
                     <div className="flex items-center mt-2">
                        <Button
                           type="button"
                           onClick={handleClick}
                           variant="outline"
                        >
                           <Upload className="!size-4" />
                           {translations("chooseFiles")}
                        </Button>
                        {files.length > 0 && (
                           <span className="text-sm text-muted-foreground ml-2">
                              {files.length}{" "}
                              {files.length === 1
                                 ? translations("fileSelected")
                                 : translations("filesSelected")}
                           </span>
                        )}
                     </div>
                     {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                           {files.map((file, index) => (
                              <div
                                 key={index}
                                 className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                              >
                                 <div className="flex-1 min-w-0">
                                    <p
                                       className="text-sm break-all"
                                       title={file.name}
                                    >
                                       {file.name.length > 40
                                          ? `${file.name.substring(0, 20)}...${file.name.substring(file.name.length - 17)}`
                                          : file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                       {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                 </div>
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                 >
                                    <X />
                                 </Button>
                              </div>
                           ))}
                        </div>
                     )}
                     {/* Error messages */}
                     {files.map((file, index) => (
                        <div key={index}>
                           {fileSizeErrors[index] && (
                              <p className="text-red-600 text-sm mt-1">
                                 {documentTranslations("documentTooLargeError")}{" "}
                                 ({file.name})
                              </p>
                           )}
                           {blankStatuses[index] && (
                              <p className="text-red-600 text-sm mt-1">
                                 {documentTranslations("blankPdfError")} (
                                 {file.name})
                              </p>
                           )}
                        </div>
                     ))}
                     {docId ? (
                        <div className="mt-6">
                           <Label htmlFor="file">
                              {documentTranslations("versionTagName")}
                           </Label>
                           <Input
                              type="text"
                              onChange={handleVersionTagNameInputChange}
                              value={versionTagName}
                              maxLength={50}
                           />
                        </div>
                     ) : undefined}
                  </div>
               </div>
               <DialogFooter className="flex flex-row justify-between space-x-4">
                  <Button
                     className="w-1/2 sm:w-auto"
                     type="button"
                     variant="destructive"
                     onClick={() => {
                        setOpen(false);
                        setBlankStatuses([]);
                        setFileSizeErrors([]);
                        setFiles([]);
                     }}
                  >
                     {translations("cancel")}
                  </Button>
                  <Button
                     disabled={
                        isUploading || hasValidationErrors || files.length === 0
                     }
                     type="submit"
                     className="w-1/2 sm:w-auto"
                     data-test-id="document-upload-submit-button"
                  >
                     {isUploading ? (
                        <>
                           <Loader2 className="animate-spin" />
                           {translations("uploading")}
                        </>
                     ) : (
                        uploadButtonTitle
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}

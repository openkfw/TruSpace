"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Download } from "lucide-react";

import DocumentUpload from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { useDocuments } from "@/contexts/DocumentsContext";
import { DOCUMENTS_ENDPOINT, useTagsStatus } from "@/lib/services";

import DocumentData from "./DocumentData";
import DocumentEditable from "./DocumentEditable";
import DocumentPerspectives from "./DocumentPerspectives";
import DocumentPreview from "./DocumentPreview";
import DocumentTags from "./DocumentTags";
import DocumentVersions from "./DocumentVersions";
import FloatingChat from "./FloatingChat";

export default function DocumentDetailsPage() {
   const { documentId, workspaceId } = useParams() as {
      documentId: string;
      workspaceId: string;
   };
   const { document, fetchDocumentDetails } = useDocuments();
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [activeTab, setActiveTab] = useState(() => {
      if (typeof window !== "undefined") {
         const allowedTabs = ["details", "preview", "versions"];
         const storedTab = localStorage.getItem("document-details-tab");
         return allowedTabs.includes(storedTab) ? storedTab : "details";
      }
      return "details";
   });

   const { status: tagsStatus } = useTagsStatus(document?.cid);

   const [newNoteVisible, setNewNoteVisible] = useState(false);
   const [newNotePosition, setNewNotePosition] = useState<{
      x: number;
      y: number;
   }>();
   const [noteVisible, setNoteVisible] = useState(false);
   const [notePosition, setNotePosition] = useState<{ x: number; y: number }>();
   const [pageNumber, setPageNumber] = useState<number>(1);
   const [openDocumentUpload, setOpenDocumentUpload] = useState(false);

   const generalTranslations = useTranslations("general");
   const documentTranslations = useTranslations("document");
   const documentPreviewTranslations = useTranslations("documentPreview");
   const tagsTranslations = useTranslations("tags");
   const perspectivesTranslations = useTranslations("perspectives");
   const homeTranslations = useTranslations("homePage");

   const handleTabChange = (value: string) => {
      setActiveTab(value);
      localStorage.setItem("document-details-tab", value);
   };

   const displayNote = useCallback(
      ({ x, y }) => {
         setNoteVisible(true);
         setNewNoteVisible(false);
         setNotePosition({ x, y });
      },
      [setNoteVisible, setNewNoteVisible, setNotePosition]
   );

   useEffect(() => {
      const loadDocumentDetails = async () => {
         try {
            await fetchDocumentDetails(documentId);
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };
      loadDocumentDetails();
   }, [documentId, fetchDocumentDetails]);

   useEffect(() => {
      return () => {
         localStorage.removeItem("document-details-tab");
      };
   }, []);

   if (loading) return <p>{generalTranslations("loading")}</p>;
   if (error)
      return (
         <p>
            {generalTranslations("error")}: {error}
         </p>
      );

   const isPreviewAvailable =
      document?.meta?.filename?.endsWith(".pdf") ||
      document?.meta?.filename?.endsWith(".docx") ||
      document?.meta?.filename?.endsWith(".editableFile");

   const isRichTextDocument =
      document?.meta?.filename?.endsWith(".editableFile");

   const downloadFile = async () => {
      if (!document) return;
      window.open(`${DOCUMENTS_ENDPOINT}/version/${document?.cid}`);
   };

   return (
      <>
         <div className="min-w-0 flex-1">
            <h1 className="text-2xl/7 font-bold sm:truncate sm:text-3xl sm:tracking-tight mt-2">
               {isRichTextDocument
                  ? document?.meta?.filename.slice(0, -13)
                  : document?.meta?.filename}

               {!isRichTextDocument && (
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              variant="link"
                              className="ml-2"
                              onClick={downloadFile}
                           >
                              <Download className="!size-6" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           {documentTranslations("download")}{" "}
                           {document?.meta?.filename}
                        </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
               )}
            </h1>
         </div>
         <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full mt-4"
         >
            <TabsList className="grid grid-cols-3 bg-blue-200 dark:bg-muted">
               <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:dark:bg-blue-800 data-[state=active]:text-white"
               >
                  {documentTranslations("details")}
               </TabsTrigger>
               <TabsTrigger
                  value="preview"
                  disabled={!isPreviewAvailable}
                  className="data-[state=active]:bg-blue-500 data-[state=active]:dark:bg-blue-800 data-[state=active]:text-white"
               >
                  {isPreviewAvailable
                     ? documentPreviewTranslations("preview")
                     : documentPreviewTranslations("noPreview")}
               </TabsTrigger>
               <TabsTrigger
                  value="versions"
                  className="data-[state=active]:bg-blue-500 data-[state=active]:dark:bg-blue-800 data-[state=active]:text-white"
               >
                  {documentTranslations("versions")}
               </TabsTrigger>
            </TabsList>
            <TabsContent
               value="details"
               className="flex gap-x-4 max-[1200px]:flex-col"
            >
               <Card className="w-2/4 max-[1200px]:w-full mb-4 bg-transparent mt-2">
                  <CardContent className="p-6">
                     <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                        {documentTranslations("metadata")}
                     </h2>
                     <DocumentData
                        docId={document.docId}
                        cId={document.cid}
                        meta={document.meta}
                        documentVersions={document.documentVersions}
                        workspaceOrigin={document.meta?.workspaceOrigin}
                     />
                  </CardContent>
               </Card>
               <div className="w-2/4 max-[1200px]:w-full flex flex-col">
                  <Card className="mb-4 bg-transparent mt-2 max-[1200px]:mt-0">
                     <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                           {tagsTranslations("title")}
                        </h2>
                        <DocumentTags
                           cid={document.cid}
                           docId={document.docId}
                           workspaceOrigin={document.meta?.workspaceOrigin}
                           status={tagsStatus}
                        />
                     </CardContent>
                  </Card>
                  <Card className="mb-4 bg-transparent">
                     <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                           {perspectivesTranslations("title")}
                        </h2>
                        <DocumentPerspectives
                           cid={document.cid}
                           docId={document.docId}
                           workspaceOrigin={document.meta?.workspaceOrigin}
                        />
                     </CardContent>
                  </Card>
               </div>
            </TabsContent>
            <TabsContent value="preview">
               <div className="flex justify-center mx-auto">
                  {isRichTextDocument ? (
                     <DocumentEditable
                        cid={document.cid}
                        docId={document.docId}
                        filename={document.meta?.filename}
                     />
                  ) : (
                     <DocumentPreview
                        cid={document.cid}
                        filename={document.meta?.filename}
                        pageNumber={pageNumber}
                        setPageNumber={setPageNumber}
                        newNoteVisible={newNoteVisible}
                        setNewNoteVisible={setNewNoteVisible}
                        newNotePosition={newNotePosition}
                        setNewNotePosition={setNewNotePosition}
                        noteVisible={noteVisible}
                        setNoteVisible={setNoteVisible}
                        notePosition={notePosition}
                        setNotePosition={setNotePosition}
                     />
                  )}
               </div>
            </TabsContent>
            <TabsContent value="versions">
               <span className="flex justify-end">
                  {!isRichTextDocument && (
                     <Button onClick={() => setOpenDocumentUpload(true)}>
                        {homeTranslations("uploadNewVersion")}
                     </Button>
                  )}
               </span>
               <DocumentVersions documentVersions={document.documentVersions} />
            </TabsContent>
         </Tabs>
         <FloatingChat
            cid={document.cid}
            docId={document.docId}
            workspaceOrigin={workspaceId}
            documentVersions={document.documentVersions}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            newNoteVisible={newNoteVisible}
            setNewNoteVisible={setNewNoteVisible}
            newNotePosition={newNotePosition}
            setNewNotePosition={setNewNotePosition}
            displayNote={displayNote}
         />
         <DocumentUpload
            docId={document.docId}
            open={openDocumentUpload}
            setOpen={setOpenDocumentUpload}
         />
      </>
   );
}

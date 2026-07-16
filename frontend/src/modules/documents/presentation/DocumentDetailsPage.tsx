"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Download, Info, Lightbulb, Tag } from "lucide-react";

import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useTagsStatus } from "@/lib/services";
import { cn } from "@/lib/utils";
import { DOCUMENTS_ENDPOINT } from "@/shared/config";

import DocumentChat from "./DocumentChat";
import DocumentData from "./DocumentData";
import DocumentEditable from "./DocumentEditable";
import DocumentMetaChips from "./DocumentMetaChips";
import DocumentPerspectives from "./DocumentPerspectives";
import DocumentPreview from "./DocumentPreview";
import DocumentTags from "./DocumentTags";
import DocumentUpload from "./DocumentUpload";
import DocumentVersions from "./DocumentVersions";

function getDisplayExtension(filename?: string): string | null {
   if (!filename) return null;
   const lower = filename.toLowerCase();
   if (lower.endsWith(".editablefile")) return "editable";
   const parts = lower.split(".");
   if (parts.length < 2) return null;
   const ext = parts.pop();
   return ext ? ext.toUpperCase() : null;
}

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
   const [chatCollapsed, setChatCollapsed] = useState(false);

   const generalTranslations = useTranslations("general");
   const documentTranslations = useTranslations("document");
   const documentPreviewTranslations = useTranslations("documentPreview");
   const tagsTranslations = useTranslations("tags");
   const perspectivesTranslations = useTranslations("perspectives");
   const homeTranslations = useTranslations("homePage");
   const chatTranslations = useTranslations("chat");

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
      document?.meta?.filename?.endsWith(".pptx") ||
      document?.meta?.filename?.endsWith(".editableFile");

   const isRichTextDocument =
      document?.meta?.filename?.endsWith(".editableFile");

   const displayFilename = isRichTextDocument
      ? document?.meta?.filename?.slice(0, -13)
      : document?.meta?.filename;

   const extensionLabel = getDisplayExtension(document?.meta?.filename);
   const latestVersionNumber =
      document?.documentVersions?.length ||
      document?.meta?.version;

   const downloadFile = async () => {
      if (!document) return;
      window.open(`${DOCUMENTS_ENDPOINT}/version/${document?.cid}`);
   };

   return (
      <>
         {/* Page header: title, key actions, and at-a-glance metadata chips */}
         <header className="min-w-0 flex-1 mt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
               <h1 className="text-2xl/7 font-bold sm:text-3xl sm:tracking-tight break-words">
                  {displayFilename}
               </h1>

               {!isRichTextDocument && (
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              variant="link"
                              className="px-1"
                              onClick={downloadFile}
                           >
                              <Download className="!size-5" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           {documentTranslations("download")}{" "}
                           {document?.meta?.filename}
                        </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
               )}

               {extensionLabel && (
                  <Badge
                     variant="secondary"
                     className="uppercase tracking-wide"
                  >
                     {extensionLabel}
                  </Badge>
               )}
            </div>

            <div className="mt-2">
               <DocumentMetaChips
                  meta={document?.meta}
                  version={latestVersionNumber}
               />
            </div>
         </header>

         {/*
            Two-column layout that persists across tabs:
              - Left (40%): collapsible Chat & Activity panel.
              - Right (60%): tabs whose content swaps between details (sidebar
                accordions), preview (PDF/editor), and versions (table).
            Collapses to a single stacked column below 1200px.
         */}
         <div
            className={cn(
               "mt-4 grid grid-cols-1 gap-4 min-[1200px]:gap-6 min-[1200px]:items-start",
               chatCollapsed
                  ? "min-[1200px]:grid-cols-[3rem_minmax(0,1fr)]"
                  : "min-[1200px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            )}
         >
            {/* Left column: Chat & Activity */}
            <Card
               className={cn(
                  "bg-transparent flex flex-col overflow-hidden p-0 min-[1200px]:sticky min-[1200px]:top-4",
                  chatCollapsed
                     ? "h-12 min-h-0 min-[1200px]:w-12"
                     : "h-[70vh] min-h-[480px] min-[1200px]:h-[calc(100vh-13rem)] min-[1200px]:max-h-[calc(100vh-13rem)]"
               )}
            >
               <DocumentChat
                  title={chatTranslations("chatAndActivity")}
                  cid={document.cid}
                  docId={document.docId}
                  workspaceOrigin={workspaceId}
                  documentVersions={document.documentVersions}
                  documentPageNumber={pageNumber}
                  setDocumentPageNumber={setPageNumber}
                  newNoteVisible={newNoteVisible}
                  setNewNoteVisible={setNewNoteVisible}
                  newNotePosition={newNotePosition}
                  setNewNotePosition={setNewNotePosition}
                  displayNote={displayNote}
                  collapsed={chatCollapsed}
                  onToggleCollapsed={() => setChatCollapsed((value) => !value)}
               />
            </Card>

            {/* Right column: tabs */}
            <div className="min-w-0">
               <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
               >
                  <TabsList className="grid grid-cols-3 bg-blue-100 dark:bg-slate-800">
                     <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-blue-200 data-[state=active]:dark:bg-blue-900 data-[state=active]:text-blue-800 data-[state=active]:dark:text-blue-400"
                     >
                        {documentTranslations("details")}
                     </TabsTrigger>
                     <TabsTrigger
                        value="preview"
                        disabled={!isPreviewAvailable}
                        className="data-[state=active]:bg-blue-200 data-[state=active]:dark:bg-blue-900 data-[state=active]:text-blue-800 data-[state=active]:dark:text-blue-400"
                     >
                        {isRichTextDocument
                           ? documentPreviewTranslations("editor")
                           : isPreviewAvailable
                             ? documentPreviewTranslations("preview")
                             : documentPreviewTranslations("noPreview")}
                     </TabsTrigger>
                     <TabsTrigger
                        value="versions"
                        className="data-[state=active]:bg-blue-200 data-[state=active]:dark:bg-blue-900 data-[state=active]:text-blue-800 data-[state=active]:dark:text-blue-400"
                     >
                        {documentTranslations("versions")}
                     </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                     <Accordion
                        type="multiple"
                        defaultValue={["tags", "perspectives"]}
                        className="space-y-3"
                     >
                        <Card className="bg-transparent">
                            <AccordionItem
                              value="metadata"
                              className="border-b-0"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                  <span className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    {documentTranslations("metadata")}
                                  </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-0">
                                  <DocumentData
                                    docId={document.docId}
                                    cId={document.cid}
                                    meta={document.meta}
                                    documentVersions={document.documentVersions}
                                    workspaceOrigin={
                                        document.meta?.workspaceOrigin
                                    }
                                  />
                              </AccordionContent>
                            </AccordionItem>
                        </Card>

                        <Card className="bg-transparent">
                           <AccordionItem value="tags" className="border-b-0">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                 <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    {tagsTranslations("title")}
                                 </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-0">
                                 <DocumentTags
                                    cid={document.cid}
                                    docId={document.docId}
                                    workspaceOrigin={
                                       document.meta?.workspaceOrigin
                                    }
                                    status={tagsStatus}
                                 />
                              </AccordionContent>
                           </AccordionItem>
                        </Card>

                        <Card className="bg-transparent">
                           <AccordionItem
                              value="perspectives"
                              className="border-b-0"
                           >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                 <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                                    {perspectivesTranslations("title")}
                                 </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 pt-0">
                                 <DocumentPerspectives
                                    cid={document.cid}
                                    docId={document.docId}
                                    workspaceOrigin={
                                       document.meta?.workspaceOrigin
                                    }
                                 />
                              </AccordionContent>
                           </AccordionItem>
                        </Card>
                     </Accordion>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                     <div className="flex justify-center mx-auto">
                        {isRichTextDocument ? (
                           <DocumentEditable
                              cid={document.cid}
                              docId={document.docId}
                              filename={document.meta?.filename}
                              initialVersionTagName={
                                 document.meta?.versionTagName
                              }
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

                  <TabsContent value="versions" className="mt-4">
                     <span className="flex justify-end">
                        {!isRichTextDocument && (
                           <Button onClick={() => setOpenDocumentUpload(true)}>
                              {homeTranslations("uploadNewVersion")}
                           </Button>
                        )}
                     </span>
                     <DocumentVersions
                        documentVersions={document.documentVersions}
                     />
                  </TabsContent>
               </Tabs>
            </div>
         </div>

         <DocumentUpload
            docId={document.docId}
            open={openDocumentUpload}
            setOpen={setOpenDocumentUpload}
         />
      </>
   );
}

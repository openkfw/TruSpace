"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { FileText, Folder, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { ChatMessage } from "@/interfaces";
import { useRecentChats } from "@/lib/services";

export default function Dashboard() {
   const { allDocuments, fetchAllDocuments } = useDocuments();
   const { availableWorkspaces } = useWorkspaceContext();
   const router = useRouter();
   const [err, setErr] = useState(null);
   const [loading, setLoading] = useState(true);
   const { chats, error, isLoading } = useRecentChats();
   const generalTranslations = useTranslations("general");
   const homeTranslations = useTranslations("homePage");

   useEffect(() => {
      const loadAllDocuments = async () => {
         try {
            fetchAllDocuments();
         } catch (err) {
            setErr(err.message);
         } finally {
            setLoading(false);
         }
      };
      loadAllDocuments();
   }, []);

   const lastChatMessage: ChatMessage = chats?.sort(
      (
         a: { meta: { timestamp: string } },
         b: { meta: { timestamp: string } }
      ) =>
         new Date(b.meta?.timestamp).getTime() -
         new Date(a.meta?.timestamp).getTime()
   )[0];

   const lastEditedDocument = allDocuments.sort(
      (a, b) =>
         new Date(b.meta?.timestamp).getTime() -
         new Date(a.meta?.timestamp).getTime()
   )[0];

   const lastChatMessageDocName = allDocuments.find(
      (doc) => doc.docId === lastChatMessage?.meta?.docId
   )?.meta?.filename;

   const recentlyAddedWorkspace = availableWorkspaces?.sort(
      (a, b) =>
         new Date(b.meta?.created_at).getTime() -
         new Date(a.meta?.created_at).getTime()
   )[0];

   const cardBaseStyles = `group relative overflow-hidden bg-white dark:bg-gray-800 hover:scale-[1.02] hover:-translate-y-1 hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-600
      transition-all duration-300 ease-out cursor-pointer before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-100 before:to-transparent dark:before:from-blue-900/20
      before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`;

   const iconWrapStyles =
      "transition-transform duration-300 group-hover:scale-110 group-hover:text-blue-600";

   return (
      <div className="space-y-10">
         <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
               {homeTranslations("documentActions")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card
                  className={cardBaseStyles}
                  onClick={() =>
                     router.push(
                        `/workspace/${lastEditedDocument?.meta?.workspaceOrigin}/document/${lastEditedDocument?.docId}`
                     )
                  }
               >
                  <CardHeader className="flex flex-row items-center gap-2 relative z-10">
                     <FileText className={`text-blue-500 ${iconWrapStyles}`} />
                     <CardTitle>
                        {homeTranslations("lastEditedDocument")}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-2 relative z-10">
                     {loading ? (
                        <p className="text-muted-foreground">
                           {generalTranslations("loading")}
                        </p>
                     ) : err ? (
                        <p className="text-red-500">{err}</p>
                     ) : lastEditedDocument ? (
                        <>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("document")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {lastEditedDocument.meta.filename ||
                                    homeTranslations("unknownDocument")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("editedBy")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {lastEditedDocument.meta.creator ||
                                    homeTranslations("unknownCreator")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("editedOn")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {new Date(
                                    Number(lastEditedDocument.meta.timestamp)
                                 ).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false
                                 })}
                              </span>
                           </div>
                        </>
                     ) : (
                        <p className="text-muted-foreground">
                           {homeTranslations("noDocumentAvailable")}
                        </p>
                     )}
                  </CardContent>
               </Card>
               <Card
                  className={cardBaseStyles}
                  onClick={() =>
                     router.push(
                        `/workspace/${lastChatMessage?.meta?.workspaceOrigin}/document/${lastChatMessage?.meta?.docId}`
                     )
                  }
               >
                  <CardHeader className="flex flex-row items-center gap-2 relative z-10">
                     <MessageCircle
                        className={`text-blue-500 ${iconWrapStyles}`}
                     />
                     <CardTitle>
                        {homeTranslations("lastChatMessage")}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-2 relative z-10">
                     {isLoading ? (
                        <p className="text-muted-foreground">
                           {generalTranslations("loading")}
                        </p>
                     ) : error ? (
                        <p className="text-red-500">{error}</p>
                     ) : lastChatMessage ? (
                        <>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("document")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {lastChatMessageDocName ||
                                    homeTranslations("unknownDocument")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("addedBy")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {lastChatMessage.meta.creator ||
                                    homeTranslations("unknownCreator")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("sentOn")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {new Date(
                                    Number(lastChatMessage.meta.timestamp)
                                 ).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false
                                 })}
                              </span>
                           </div>
                        </>
                     ) : (
                        <p className="text-muted-foreground">
                           {homeTranslations("noChatMessageAvailable")}
                        </p>
                     )}
                  </CardContent>
               </Card>
            </div>
         </div>
         <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
               {homeTranslations("workspaceActions")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card
                  className={cardBaseStyles}
                  onClick={() =>
                     router.push(
                        `/workspace/${recentlyAddedWorkspace?.meta?.workspace_uuid}`
                     )
                  }
               >
                  <CardHeader className="flex flex-row items-center gap-2 relative z-10">
                     <Folder className={`text-blue-500 ${iconWrapStyles}`} />
                     <CardTitle>
                        {homeTranslations("recentlyAddedWorkspace")}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-2 relative z-10">
                     {recentlyAddedWorkspace ? (
                        <>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {generalTranslations("workspace")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {recentlyAddedWorkspace.meta.name ||
                                    homeTranslations("unknownDocument")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("addedBy")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {recentlyAddedWorkspace.meta.creator_name ||
                                    homeTranslations("unknownCreator")}
                              </span>
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground">
                                 {homeTranslations("addedOn")}:
                              </span>
                              <span className="text-base font-semibold truncate">
                                 {new Date(
                                    recentlyAddedWorkspace.meta.created_at
                                 ).toLocaleString()}
                              </span>
                           </div>
                        </>
                     ) : (
                        <p className="text-muted-foreground">
                           {homeTranslations("noRecentWorkspaceAvailable")}
                        </p>
                     )}
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}

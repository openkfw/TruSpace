"use client";
import ChatMessage from "@/components/ChatMessage";
import InfoLabel from "@/components/InfoLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { ChatMessage as Chat } from "@/interfaces";
import { getChatsPdfExportUrl, loadChats, postChat } from "@/lib/services";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export default function DocumentChat({
   cid,
   docId,
   workspaceOrigin,
   documentVersions,
   documentPageNumber,
   setDocumentPageNumber,
   newNoteVisible,
   setNewNoteVisible,
   newNotePosition,
   setNewNotePosition,
   displayNote
}) {
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [chats, setChats] = useState<Chat[] | null>(null);
   const [message, setMessage] = useState("");
   const [emptyMessageError, setEmptyMessageError] = useState(false);
   const translations = useTranslations("chat");
   const generalTranslations = useTranslations("general");

   const hideNewNote = useCallback(() => {
      setNewNoteVisible(false);
      setNewNotePosition(null);
   }, [setNewNoteVisible, setNewNotePosition]);

   const fetchChats = useCallback(async () => {
      try {
         const data = await loadChats(docId, translations("chatError"));
         if (data) {
            setChats(data);
         } else {
            console.error(translations("invalidResponse"), data);
            throw new Error(translations("invalidResponse"));
         }
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   }, [docId, translations]);

   useEffect(() => {
      fetchChats();
   }, [fetchChats]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (message === "") {
         setEmptyMessageError(true);
         return;
      }

      const data = {
         documentCid: cid,
         message: message
      };
      if (documentPageNumber) {
         data["documentPageNumber"] = documentPageNumber;
      }
      if (newNoteVisible) {
         data["position"] = {
            x: newNotePosition?.x,
            y: newNotePosition?.y
         };
      }

      const formData = new FormData();
      formData.append("docId", docId);
      formData.append("cid", cid);
      formData.append("workspaceOrigin", workspaceOrigin);
      formData.append("data", JSON.stringify(data));

      try {
         await postChat(formData, translations("messageError"));
         setMessage("");
      } catch (err) {
         console.error(err);
      } finally {
         setNewNoteVisible(false);
         setTimeout(fetchChats, 1000);
      }
   };

   const updateMessageText = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
      if (emptyMessageError) {
         setEmptyMessageError(false);
      }
   };

   const openChatsPdfExport = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
         const url = await getChatsPdfExportUrl(docId);
         const a = document.createElement("a");
         a.href = url;
         a.download = `chats-${docId}.pdf`;
         a.click();
      } catch (err) {
         console.error(err);
      }
   };

   if (loading) {
      return <p>{generalTranslations("loading")}</p>;
   }

   if (error) {
      return (
         <p>
            {generalTranslations("error")}: {error}
         </p>
      );
   }

   return (
      <div className="flex flex-col h-full">
         <div className="flex-1 overflow-auto space-y-4 p-4">
            {chats && chats.length > 0 ? (
               chats.map((chat: Chat) => {
                  const messageData = JSON.parse(chat.meta.data);
                  return (
                     <ChatMessage
                        key={chat.cid}
                        creator={chat.meta.creator}
                        version={
                           documentVersions.find(
                              (version) =>
                                 version.cid === messageData?.documentCid
                           )?.meta.version
                        }
                        timestamp={chat.meta.timestamp}
                        message={messageData.message}
                        onInfoPanelIconClick={
                           messageData?.documentCid === cid &&
                           messageData?.documentPageNumber &&
                           messageData?.position
                              ? () => {
                                   setDocumentPageNumber(
                                      messageData.documentPageNumber
                                   );
                                   displayNote(messageData.position);
                                }
                              : null
                        }
                        showMoreActions={false}
                     />
                  );
               })
            ) : (
               <p>{translations("noMessage")}</p>
            )}
         </div>
         <div className="border-t border-border p-4">
            <form
               onSubmit={handleSubmit}
               className="flex flex-col gap-2 w-full"
            >
               {newNoteVisible && (
                  <InfoLabel
                     text={translations("documentNote")}
                     secondaryText={translations("secondaryMessage")}
                     iconOnClick={hideNewNote}
                  />
               )}
               <Input
                  type="text"
                  placeholder={translations("messagePlaceholder")}
                  value={message}
                  onChange={updateMessageText}
                  className={`bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white ${
                     emptyMessageError && "border-red-500"
                  }`}
               />
               {emptyMessageError && (
                  <p className="text-red-500 text-sm">
                     {translations("emptyMessageErrorText")}
                  </p>
               )}
               <div className="flex justify-between items-center">
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={openChatsPdfExport}
                              className="p-2 bg-transparent"
                           >
                              <Download />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           {translations("downloadChatMessages")}
                        </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
                  <Button type="submit">{translations("send")}</Button>
               </div>
            </form>
         </div>
      </div>
   );
}

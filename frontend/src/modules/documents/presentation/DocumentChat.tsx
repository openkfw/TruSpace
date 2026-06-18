"use client";
import { useCallback, useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { MessageCircle } from "lucide-react";

import ChatMessage from "@/components/ChatMessage";
import InfoLabel from "@/components/InfoLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadChats, postChat } from "@/lib/services";
import { cn } from "@/lib/utils";
import { ChatMessage as Chat } from "@/modules/chats/domain";
import { Document } from "@/modules/documents/domain";

interface DocumentChatProps {
   cid: string;
   docId: string;
   workspaceOrigin: string;
   documentVersions: Document[];
   documentPageNumber?: number;
   setDocumentPageNumber: (page: number) => void;
   newNoteVisible: boolean;
   setNewNoteVisible: (visible: boolean) => void;
   newNotePosition?: { x: number; y: number } | null;
   setNewNotePosition: (pos: { x: number; y: number } | null) => void;
   displayNote: ({ x, y }: { x: number; y: number }) => void;
   /**
    * Optional title rendered as a sticky header above the chat. When provided,
    * the chat assumes it's embedded inline (e.g. in the details page) and skips
    * the top padding reserved for the FloatingChat close button.
    */
   title?: string;
   /**
    * Optional extra classes for the outer container.
    */
   className?: string;
}

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
   displayNote,
   title,
   className
}: DocumentChatProps) {
   const [loading, setLoading] = useState(true);
   const [sending, setSending] = useState(false);
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
      setSending(true);

      const data: Record<string, unknown> = {
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
         setSending(false);
      }
   };

   const updateMessageText = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
      if (emptyMessageError) {
         setEmptyMessageError(false);
      }
   };

   const renderBody = () => {
      if (loading) {
         return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
               {generalTranslations("loading")}
            </div>
         );
      }
      if (error) {
         return (
            <div className="flex-1 flex items-center justify-center text-sm text-destructive">
               {generalTranslations("error")}: {error}
            </div>
         );
      }
      return (
         <div
            className={cn(
               "flex-1 overflow-auto space-y-4 px-4 pb-4",
               title ? "pt-4" : "pt-10 mt-2"
            )}
         >
            {chats && chats.length > 0 ? (
               chats.map((chat: Chat) => {
                  const messageData = JSON.parse(chat.meta.data);
                  return (
                     <ChatMessage
                        key={chat.cid}
                        creator={chat.meta.creatorName}
                        isOwnMessage={chat.isOwnMessage}
                        version={
                           documentVersions.find(
                              (version) =>
                                 version.cid === messageData?.documentCid
                           )?.meta.version
                        }
                        versionTagName={
                           documentVersions.find(
                              (version) =>
                                 version.cid === messageData?.documentCid
                           )?.meta.versionTagName
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
                     />
                  );
               })
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-10">
                  <MessageCircle className="h-8 w-8 mb-2 opacity-40" />
                  {translations("noMessage")}
               </div>
            )}
         </div>
      );
   };

   return (
      <div className={cn("flex flex-col h-full min-h-0", className)}>
         {title && (
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 bg-card/60 backdrop-blur-sm rounded-t-xl">
               <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  {title}
               </h3>
            </div>
         )}
         {renderBody()}
         <div className="border-t border-border p-4 shrink-0">
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
               <div className="flex justify-between items-center">
                  <Input
                      type="text"
                      placeholder={translations("messagePlaceholder")}
                      value={message}
                      onChange={updateMessageText}
                      className={`mr-3 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white ${
                        emptyMessageError && "border-red-500"
                      }`}
                  />
                  {emptyMessageError && (
                      <p className="text-red-500 text-sm">
                        {translations("emptyMessageErrorText")}
                      </p>
                  )}
                  <Button type="submit" disabled={sending}>
                     {sending ? translations("sending") : translations("send")}
                  </Button>
               </div>
            </form>
         </div>
      </div>
   );
}

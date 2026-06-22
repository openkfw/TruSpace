"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "next-intl";

import { MessageCircle } from "lucide-react";

import ChatMessage from "@/components/ChatMessage";
import InfoLabel from "@/components/InfoLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   loadChats,
   loadEventsByDocumentId,
   notifyDocumentActivity,
   postChat,
   useDocumentActivitySubscription
} from "@/lib/services";
import { cn } from "@/lib/utils";
import { ChatMessage as Chat } from "@/modules/chats/domain";
import { Document } from "@/modules/documents/domain";
import { ActivityEntry, ActivityEvent } from "@/modules/events";

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

/**
 * Item rendered in the timeline. Chat messages and events share the same
 * container so they can be ordered chronologically without duplication. The
 * `sortKey` is computed once per item so the merge is stable across renders.
 */
type TimelineItem =
   | { kind: "chat"; sortKey: number; chat: Chat }
   | { kind: "event"; sortKey: number; event: ActivityEvent };

/**
 * Convert a chat or event timestamp (epoch-ms-as-string for chats, ISO 8601
 * for events) into a numeric sort key. Returns 0 for unparseable values so
 * malformed entries fall to the start of the list rather than NaN-poisoning
 * the comparator.
 */
function toSortKey(timestamp: string | number | undefined): number {
   if (timestamp == null) return 0;
   if (typeof timestamp === "number") return timestamp;
   const numeric = Number(timestamp);
   if (Number.isFinite(numeric)) return numeric;
   const parsed = new Date(timestamp).getTime();
   return Number.isFinite(parsed) ? parsed : 0;
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
   const [events, setEvents] = useState<ActivityEvent[] | null>(null);
   const [message, setMessage] = useState("");
   const [emptyMessageError, setEmptyMessageError] = useState(false);
   const translations = useTranslations("chat");
   const eventTranslations = useTranslations("events");
   const generalTranslations = useTranslations("general");

   const hideNewNote = useCallback(() => {
      setNewNoteVisible(false);
      setNewNotePosition(null);
   }, [setNewNoteVisible, setNewNotePosition]);

   const fetchTimeline = useCallback(async () => {
      try {
         // Chats and events are independent endpoints - fetch in parallel.
         // If events fail we still want to show chat messages, so the event
         // failure is swallowed and only chat errors surface to the UI.
         const [chatData, eventData] = await Promise.all([
            loadChats(docId, translations("chatError")),
            loadEventsByDocumentId(docId, eventTranslations("loadError")).catch(
               (err) => {
                  console.error("Failed to load activity events", err);
                  return [] as ActivityEvent[];
               }
            )
         ]);

         if (chatData) {
            setChats(chatData);
         } else {
            console.error(translations("invalidResponse"), chatData);
            throw new Error(translations("invalidResponse"));
         }
         setEvents(eventData ?? []);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   }, [docId, translations, eventTranslations]);

   useEffect(() => {
      // Initial load.
      fetchTimeline();

      // Refresh immediately when the user comes back to the tab, so
      // returning from another window feels instant and we still catch
      // updates produced by other users (cross-browser changes are not
      // covered by the local activity bus).
      const onVisible = () => {
         if (document.visibilityState === "visible") {
            fetchTimeline();
         }
      };
      document.addEventListener("visibilitychange", onVisible);

      return () => {
         document.removeEventListener("visibilitychange", onVisible);
      };
   }, [fetchTimeline]);

   // Refresh whenever someone (this tab or another tab in the same browser)
   // signals new activity for this document - new chat, tag added/removed,
   // perspective created, version uploaded, AI generation finished, ...
   // This replaces the previous 5s polling loop, which was hammering the
   // IPFS allocations endpoint for every open chat.
   useDocumentActivitySubscription(docId, fetchTimeline);

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
         // Notify the local activity bus instead of refetching directly.
         // The chat itself is subscribed, so this refreshes the timeline
         // here AND in any other tab that has the same document open.
         // The short delay gives the backend a moment to persist the chat
         // to IPFS before the refetch hits the listing endpoint.
         notifyDocumentActivity(docId, { delayMs: 1000 });
         setSending(false);
      }
   };

   const updateMessageText = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
      if (emptyMessageError) {
         setEmptyMessageError(false);
      }
   };

   /**
    * Merge chats and events into a single chronologically ordered list. Both
    * arrays are already sorted by their respective backends, so the merge is
    * stable and cheap. Recomputed only when inputs change.
    */
   const timeline = useMemo<TimelineItem[]>(() => {
      const items: TimelineItem[] = [];
      (chats ?? []).forEach((chat) =>
         items.push({
            kind: "chat",
            sortKey: toSortKey(chat.meta.timestamp),
            chat
         })
      );
      (events ?? []).forEach((event) =>
         items.push({
            kind: "event",
            sortKey: toSortKey(event.meta.timestamp),
            event
         })
      );
      items.sort((a, b) => a.sortKey - b.sortKey);
      return items;
   }, [chats, events]);

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
            {timeline.length > 0 ? (
               timeline.map((item) => {
                  if (item.kind === "event") {
                     return (
                        <ActivityEntry
                           key={`event-${item.event.cid}`}
                           event={item.event}
                        />
                     );
                  }

                  const chat = item.chat;
                  const messageData = JSON.parse(chat.meta.data);
                  return (
                     <ChatMessage
                        key={`chat-${chat.cid}`}
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

"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import {
   MessageCircle,
   PanelLeftClose,
   PanelLeftOpen
} from "lucide-react";

import ChatMessage from "@/components/ChatMessage";
import InfoLabel from "@/components/InfoLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   editChat,
   likeChat,
   postChat,
   unlikeChat,
   useChats,
   useEventsByDocumentId
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
    * Whether the chat content is collapsed into a compact toggle.
    */
   collapsed?: boolean;
   /**
    * Called when the collapse toggle is activated.
    */
   onToggleCollapsed?: () => void;
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

/**
 * Shape of the decoded `chat.meta.data` payload. Kept partial/optional
 * everywhere because a message that failed to parse falls back to `{}`.
 */
interface ChatMessageData {
   documentCid?: string;
   message?: string;
   documentPageNumber?: number;
   position?: { x: number; y: number };
   [key: string]: unknown;
}

/**
 * `chat.meta.data` is a JSON string produced client-side and round-tripped
 * through IPFS cluster pin metadata. If it was ever stored unencoded (e.g. a
 * message containing raw double quotes before the metadata-encoding fix),
 * the stored value can come back truncated/malformed. Parsing that directly
 * during render would throw synchronously and take down the whole document
 * page - not just this one message - since there's no error boundary around
 * the timeline. Parse defensively instead so a single bad message just
 * renders as unavailable.
 */
function safeParseChatData(raw: string): {
   data: ChatMessageData;
   corrupted: boolean;
} {
   try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
         return { data: parsed as ChatMessageData, corrupted: false };
      }
      return { data: {}, corrupted: true };
   } catch {
      return { data: {}, corrupted: true };
   }
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
   collapsed = false,
   onToggleCollapsed,
   className
}: DocumentChatProps) {
   const [sending, setSending] = useState(false);
   const [message, setMessage] = useState("");
   const [emptyMessageError, setEmptyMessageError] = useState(false);
   const scrollContainerRef = useRef<HTMLDivElement | null>(null);
   const translations = useTranslations("chat");
   const generalTranslations = useTranslations("general");

   // Chats and events are fetched with SWR. That gives us:
   // - Automatic revalidation on mount and on window focus (so returning
   //   to the tab feels instant).
   // - Background polling via `refreshInterval` inside the hooks, so
   //   activity from *other* nodes / browsers shows up here without any
   //   manual refresh.
   // - `mutate` for instant local refreshes right after a write.
   const {
      chats,
      error: chatsError,
      isLoading: chatsLoading,
      mutate: mutateChats
   } = useChats(docId);
   const {
      events,
      error: eventsError,
      isLoading: eventsLoading,
      mutate: mutateEvents
   } = useEventsByDocumentId(docId);

   const loading = chatsLoading || eventsLoading;
   // Only surface chat errors to the user - a missing event feed should
   // still let the chat render, matching the previous behaviour.
   const error = chatsError;
   if (eventsError) {
      console.error("Failed to load activity events", eventsError);
   }

   const hideNewNote = () => {
      setNewNoteVisible(false);
      setNewNotePosition(null);
   };

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
         // Give the backend a moment to persist the chat to IPFS before we
         // ask SWR to refetch, otherwise the listing endpoint would still
         // return the pre-write state.
         window.setTimeout(() => {
            mutateChats();
            mutateEvents();
         }, 1000);
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

   // Auto-scroll to the newest message/activity at the bottom whenever the
   // timeline updates (initial load, new chat, new event, ...).
   useEffect(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
   }, [timeline, loading]);

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
               {generalTranslations("error")}: {error.message}
            </div>
         );
      }
      return (
         <div
            ref={scrollContainerRef}
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
                  const { data: messageData, corrupted } = safeParseChatData(
                     chat.meta.data
                  );
                  // Editing re-sends `messageData` merged with the new text -
                  // if the original couldn't be parsed there's nothing valid
                  // to merge into, so don't offer edit for this message.
                  const handleEdit =
                     chat.isOwnMessage && !corrupted
                        ? async (newMessage: string) => {
                             await editChat(
                                chat.cid,
                                { ...messageData, message: newMessage },
                                translations("messageError")
                             );
                             window.setTimeout(() => {
                                mutateChats();
                                mutateEvents();
                             }, 500);
                          }
                        : undefined;
                  // Likes reference the stable `chatId` (UUID preserved
                  // across edits) so reactions survive message edits. Older
                  // chats fall back to their cid server-side; mirror that
                  // fallback here so the action still works.
                  const likeTargetId = chat.meta.chatId ?? chat.cid;
                  const likedBy = (chat.likes ?? [])
                     // Oldest like first so the badge tooltip reads in the
                     // order users reacted.
                     .slice()
                     .sort(
                        (a, b) =>
                           Number(a.meta.timestamp) - Number(b.meta.timestamp)
                     )
                     .map((like) => like.meta.creatorName)
                     .filter((name): name is string => Boolean(name));
                  const handleToggleLike = async () => {
                     try {
                        if (chat.isLikedByCurrentUser) {
                           await unlikeChat(
                              likeTargetId,
                              translations("likeError")
                           );
                        } else {
                           await likeChat(
                              likeTargetId,
                              translations("likeError")
                           );
                        }
                     } finally {
                        window.setTimeout(() => {
                           mutateChats();
                        }, 500);
                     }
                  };
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
                        edited={Boolean(chat.meta.editedTimestamp)}
                        editedTimestamp={chat.meta.editedTimestamp}
                        onEdit={handleEdit}
                        likedBy={likedBy}
                        isLikedByCurrentUser={Boolean(
                           chat.isLikedByCurrentUser
                        )}
                        onToggleLike={handleToggleLike}
                        message={
                           corrupted
                              ? translations("messageUnavailable")
                              : (messageData.message ?? "")
                        }
                        onInfoPanelIconClick={
                           !corrupted &&
                           messageData?.documentCid === cid &&
                           messageData?.documentPageNumber &&
                           messageData?.position
                              ? () => {
                                   setDocumentPageNumber(
                                      messageData.documentPageNumber as number
                                   );
                                   displayNote(
                                      messageData.position as {
                                         x: number;
                                         y: number;
                                      }
                                   );
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

   if (collapsed) {
      return (
         <div
            className={cn(
               "flex h-full min-h-0 items-center justify-between border-border bg-card/60 px-3",
               "min-[1200px]:justify-center min-[1200px]:px-0",
               className
            )}
         >
            <div className="flex min-w-0 items-center gap-2 min-[1200px]:hidden">
               <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
               {title && (
                  <span className="truncate text-sm font-semibold text-foreground">
                     {title}
                  </span>
               )}
            </div>
            <Button
               type="button"
               variant="ghost"
               size="icon"
               className="shrink-0"
               onClick={onToggleCollapsed}
               aria-label="Open chat"
               title="Open chat"
            >
                <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground hidden min-[1200px]:block" />
               <PanelLeftOpen className="h-4 w-4 min-[1200px]:hidden" />
            </Button>
         </div>
      );
   }

   return (
      <div className={cn("flex flex-col h-full min-h-0", className)}>
         {title && (
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 bg-card/60 backdrop-blur-sm rounded-t-xl">
               <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  {title}
               </h3>
               <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onToggleCollapsed}
                  aria-label="Collapse chat"
                  title="Collapse chat"
               >
                  <PanelLeftClose className="h-4 w-4" />
               </Button>
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

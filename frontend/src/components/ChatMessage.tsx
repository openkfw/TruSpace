import { FormEvent, useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { format, isToday, isYesterday } from "date-fns";
import { Check, ExternalLink, Pencil, ThumbsUp, X } from "lucide-react";

import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import InfoLabel from "./InfoLabel";

interface ChatMessageProps {
   creator?: string;
   timestamp: string | number | Date;
   version?: string | number;
   versionTagName?: string;
   message: string;
   onInfoPanelIconClick?: (() => void) | null;
   isOwnMessage?: boolean;
   /**
    * `true` when this message was edited by its author. Renders an "Edited"
    * hint next to the timestamp.
    */
   edited?: boolean;
   /**
    * Time the message was last edited. Shown in a tooltip when hovering the
    * "Edited" hint. Ignored when `edited` is false.
    */
   editedTimestamp?: string | number | Date;
   /**
    * Called when the user submits an edited message text. Providing this
    * callback enables the inline edit affordance (pencil icon). The callback
    * is awaited so the UI can show a pending state and stay in edit mode if
    * the request fails.
    */
   onEdit?: (newMessage: string) => Promise<void> | void;
   /**
    * Display names of users who liked this message. Empty / undefined means
    * no likes; the like bubble is only rendered when at least one user liked.
    */
   likedBy?: string[];
   /** Whether the current viewer has liked this message. */
   isLikedByCurrentUser?: boolean;
   /**
    * Toggle a like on this message. When provided the thumbs-up affordance
    * is shown on hover. The callback is awaited so the UI can briefly
    * disable the button while the request is in flight.
    */
   onToggleLike?: () => Promise<void> | void;
}

function getInitials(name?: string) {
   if (!name) return "?";
   const trimmed = name.trim();
   if (!trimmed) return "?";
   const parts = trimmed.split(/\s+/).slice(0, 2);
   return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

/** WhatsApp-style compact timestamp. Full date is in the tooltip. */
function getCompactTime(input: string | number | Date): string {
   let date: Date;
   if (typeof input === "string") {
      const asNumber = Number(input);
      date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(input);
   } else {
      date = new Date(input);
   }
   if (isNaN(date.getTime())) return "";
   if (isToday(date)) return format(date, "HH:mm");
   if (isYesterday(date)) return format(date, "'Yesterday' HH:mm");
   return format(date, "dd MMM, HH:mm");
}

export default function ChatMessage({
   creator,
   timestamp,
   version,
   versionTagName,
   message,
   onInfoPanelIconClick,
   isOwnMessage = false,
   edited = false,
   editedTimestamp,
   onEdit,
   likedBy,
   isLikedByCurrentUser = false,
   onToggleLike
}: ChatMessageProps) {
   const translations = useTranslations("chat");
   const displayName = creator || translations("user");
   const compactTime = getCompactTime(timestamp);
   const fullTimestamp = formatDate(timestamp);
   const hasVersionTag =
      versionTagName && versionTagName !== "undefined" ? versionTagName : null;
   const canEdit = isOwnMessage && typeof onEdit === "function";
   const canLike = typeof onToggleLike === "function";
   const likeCount = likedBy?.length ?? 0;

   const [isEditing, setIsEditing] = useState(false);
   const [draft, setDraft] = useState(message);
   const [saving, setSaving] = useState(false);
   const [togglingLike, setTogglingLike] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

   // Keep the draft in sync if the parent updates the message text (e.g.
   // after a successful edit reloads the timeline with the new value).
   useEffect(() => {
      if (!isEditing) {
         setDraft(message);
      }
   }, [message, isEditing]);

   useEffect(() => {
      if (isEditing && textareaRef.current) {
         const ta = textareaRef.current;
         ta.focus();
         // Place caret at the end of the text rather than selecting all.
         const end = ta.value.length;
         ta.setSelectionRange(end, end);
      }
   }, [isEditing]);

   const startEditing = () => {
      setDraft(message);
      setIsEditing(true);
   };

   const cancelEditing = () => {
      setDraft(message);
      setIsEditing(false);
   };

   const submitEdit = async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed || trimmed === message.trim() || !onEdit) {
         cancelEditing();
         return;
      }
      try {
         setSaving(true);
         await onEdit(trimmed);
         setIsEditing(false);
      } catch (err) {
         // Stay in edit mode so the user can retry / copy their text out.
         console.error("Failed to edit chat message", err);
      } finally {
         setSaving(false);
      }
   };

   const handleToggleLike = async () => {
      if (!onToggleLike || togglingLike) return;
      try {
         setTogglingLike(true);
         await onToggleLike();
      } catch (err) {
         console.error("Failed to toggle like", err);
      } finally {
         setTogglingLike(false);
      }
   };

   const avatar = (
      <div
         className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
            isOwnMessage
               ? "bg-blue-500 dark:bg-blue-900"
               : "bg-gray-500 dark:bg-gray-700"
         )}
         aria-hidden
      >
         {getInitials(displayName)}
      </div>
   );

   return (
      <div
         className={cn(
            "group flex items-end gap-2",
            isOwnMessage && "flex-row-reverse"
         )}
      >
         {avatar}

         <div
            className={cn(
               "relative flex max-w-full min-w-0 flex-col rounded-xl px-3 py-1.5",
               // Extra bottom padding when a like badge is rendered so the
               // badge can sit below the bubble without overlapping the
               // timestamp row above.
               likeCount > 0 && "mb-3",
               isOwnMessage
                  ? "rounded-br-none bg-blue-200 dark:bg-blue-900"
                  : "rounded-bl-none bg-slate-300 dark:bg-slate-700"
            )}>
            {!isOwnMessage && (
               <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {displayName}
               </span>
            )}

            {isEditing ? (
               <form
                  onSubmit={submitEdit}
                  className="flex flex-col gap-1.5 py-1"
               >
                  <textarea
                     ref={textareaRef}
                     value={draft}
                     onChange={(e) => setDraft(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === "Escape") {
                           e.preventDefault();
                           cancelEditing();
                        } else if (e.key === "Enter" && !e.shiftKey) {
                           e.preventDefault();
                           submitEdit();
                        }
                     }}
                     rows={Math.min(6, Math.max(2, draft.split("\n").length))}
                     disabled={saving}
                     className="min-w-[200px] resize-none rounded-md border border-blue-300 bg-white/80 px-2 py-1 text-sm leading-snug text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-blue-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex items-center justify-end gap-1">
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={saving}
                        className="h-7 px-2"
                        aria-label={translations("cancel")}
                     >
                        <X className="h-3.5 w-3.5" />
                     </Button>
                     <Button
                        type="submit"
                        size="sm"
                        disabled={
                           saving ||
                           !draft.trim() ||
                           draft.trim() === message.trim()
                        }
                        className="h-7 px-2"
                        aria-label={translations("save")}
                     >
                        <Check className="h-3.5 w-3.5" />
                     </Button>
                  </div>
               </form>
            ) : (
               <p
                  className={cn(
                     "whitespace-pre-wrap break-words text-sm leading-snug text-gray-900 dark:text-white",
                     isOwnMessage ? "text-end" : "text-start"
                  )}
               >
                  {message}
               </p>
            )}

            {onInfoPanelIconClick && !isEditing && (
               <InfoLabel
                  text={translations("showPointInDocument")}
                  icon={<ExternalLink />}
                  iconOnClick={onInfoPanelIconClick}
                  isOwnMessage={isOwnMessage}
               />
            )}

            <div className="mt-0.5 flex items-center justify-end gap-1.5 text-xs leading-none text-gray-500 dark:text-gray-400">
               {canEdit && !isEditing && (
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <button
                              type="button"
                              onClick={startEditing}
                              aria-label={translations("edit")}
                              className="rounded p-0.5 opacity-0 transition-opacity hover:bg-blue-300/60 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-blue-800/60"
                           >
                              <Pencil className="h-3 w-3" />
                           </button>
                        </TooltipTrigger>
                        <TooltipContent>{translations("edit")}</TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
               )}
               <TooltipProvider>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <span className="cursor-default">{compactTime}</span>
                     </TooltipTrigger>
                     <TooltipContent>{fullTimestamp}</TooltipContent>
                  </Tooltip>
               </TooltipProvider>
               {version != null && version !== "" && (
                  <>
                     <span aria-hidden>·</span>
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <span className="cursor-default">
                                 v{version}
                                 {hasVersionTag ? ` · ${hasVersionTag}` : ""}
                              </span>
                           </TooltipTrigger>
                           <TooltipContent>
                              {translations("messageForVersion")} {version}
                              {hasVersionTag ? `, ${hasVersionTag}` : ""}
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </>
               )}
               {edited && (
                  <>
                     <span aria-hidden>·</span>
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <span className="cursor-default italic">
                                 {translations("edited")}
                              </span>
                           </TooltipTrigger>
                           <TooltipContent>
                              {editedTimestamp
                                 ? formatDate(editedTimestamp)
                                 : translations("edited")}
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </>
               )}
            </div>

            {(likeCount > 0 || (canLike && !isEditing)) && (
               // Single like control: floating badge anchored just below the
               // bubble's bottom edge, clear of the timestamp row above. When
               // there are no likes yet it only appears on hover (revealed
               // via the `group` on the message row) so it doubles as the
               // "like" affordance.
               <TooltipProvider>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <button
                           type="button"
                           onClick={canLike ? handleToggleLike : undefined}
                           disabled={!canLike || togglingLike}
                           aria-label={
                              likeCount > 0
                                 ? `${translations("likedBy")}: ${(likedBy ?? []).join(", ")}`
                                 : translations(
                                      isLikedByCurrentUser ? "unlike" : "like"
                                   )
                           }
                           aria-pressed={isLikedByCurrentUser}
                           className={cn(
                              "absolute -bottom-3.5 z-10 flex items-center gap-0.5 rounded-full border border-white/80 bg-white px-1.5 py-0.5 text-[10px] font-medium leading-none shadow-sm transition-opacity dark:border-slate-900/80 dark:bg-slate-800",
                              isOwnMessage ? "-left-1" : "-right-1",
                              isLikedByCurrentUser
                                 ? "text-blue-600 dark:text-blue-300"
                                 : "text-gray-600 dark:text-gray-300",
                              canLike
                                 ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                                 : "cursor-default",
                              // Hide the empty-state affordance until the
                              // message is hovered/focused. When at least one
                              // like exists, keep it permanently visible.
                              likeCount === 0 &&
                                 "opacity-0 group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100"
                           )}
                        >
                           <ThumbsUp
                              className={cn(
                                 "h-3 w-3",
                                 isLikedByCurrentUser && "fill-current"
                              )}
                           />
                           {likeCount > 1 && <span className="pl-1">{likeCount}</span>}
                        </button>
                     </TooltipTrigger>
                     <TooltipContent>
                        {likeCount > 0 ? (
                           <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-semibold">
                                 {translations("likedBy")}
                              </span>
                              {(likedBy ?? []).map((name, idx) => (
                                 <span key={`${name}-${idx}`}>{name}</span>
                              ))}
                           </div>
                        ) : (
                           translations(
                              isLikedByCurrentUser ? "unlike" : "like"
                           )
                        )}
                     </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
            )}
         </div>
      </div>
   );
}

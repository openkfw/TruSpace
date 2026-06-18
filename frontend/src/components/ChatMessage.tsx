import { useTranslations } from "next-intl";

import { format, isToday, isYesterday } from "date-fns";
import { ExternalLink } from "lucide-react";

import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

import InfoLabel from "./InfoLabel";

interface ChatMessageProps {
   creator?: string;
   timestamp: string | number | Date;
   version?: string | number;
   versionTagName?: string;
   message: string;
   onInfoPanelIconClick?: (() => void) | null;
   isOwnMessage?: boolean;
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
   isOwnMessage = false
}: ChatMessageProps) {
   const translations = useTranslations("chat");
   const displayName = creator || translations("user");
   const compactTime = getCompactTime(timestamp);
   const fullTimestamp = formatDate(timestamp);
   const hasVersionTag =
      versionTagName && versionTagName !== "undefined" ? versionTagName : null;

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
            "flex items-end gap-2",
            isOwnMessage && "flex-row-reverse"
         )}
      >
         {avatar}

         <div
            className={cn(
               "flex max-w-full min-w-0 flex-col rounded-xl px-3 py-1.5",
               isOwnMessage
                  ? "rounded-br-none bg-blue-200 dark:bg-blue-900"
                  : "rounded-bl-none bg-slate-300 dark:bg-slate-700"
            )}>
            {!isOwnMessage && (
               <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {displayName}
               </span>
            )}

            <p className={cn("whitespace-pre-wrap break-words text-sm leading-snug text-gray-900 dark:text-white",
            isOwnMessage
               ? "text-end"
               : "text-start"
            )}>
               {message}
            </p>

            {onInfoPanelIconClick && (
               <InfoLabel
                  text={translations("showPointInDocument")}
                  icon={<ExternalLink />}
                  iconOnClick={onInfoPanelIconClick}
                  isOwnMessage={isOwnMessage}
               />
            )}

            <div className="mt-0.5 flex items-center justify-end gap-1.5 text-xs leading-none text-gray-500 dark:text-gray-400">
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
            </div>
         </div>
      </div>
   );
}

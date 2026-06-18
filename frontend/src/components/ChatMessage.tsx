import { useTranslations } from "next-intl";

import { ExternalLink } from "lucide-react";

import { formatDate } from "@/lib/formatDate";

import InfoLabel from "./InfoLabel";

interface ChatMessageProps {
   creator?: string;
   timestamp: string | number | Date;
   version?: string | number;
   versionTagName?: string;
   message: string;
   onInfoPanelIconClick?: (() => void) | null;
}

function getInitials(name?: string) {
   if (!name) return "?";
   const trimmed = name.trim();
   if (!trimmed) return "?";
   const parts = trimmed.split(/\s+/).slice(0, 2);
   return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export default function ChatMessage({
   creator,
   timestamp,
   version,
   versionTagName,
   message,
   onInfoPanelIconClick
}: ChatMessageProps) {
   const translations = useTranslations("chat");
   const displayName = creator || translations("user");

   return (
      <div className="flex items-start gap-3">
         <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white dark:bg-blue-700"
            aria-hidden
         >
            {getInitials(displayName)}
         </div>
         <div className="flex flex-col w-full leading-1.5 p-4 border border-border bg-blue-100/80 rounded-e-xl rounded-es-xl dark:border-transparent dark:bg-gray-700">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
               <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayName}
               </span>
               <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  {formatDate(timestamp)}
               </span>
            </div>
            <div className="text-sm font-normal py-2.5 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
               {message}

               {onInfoPanelIconClick && (
                  <InfoLabel
                     text={translations("showPointInDocument")}
                     icon={<ExternalLink />}
                     iconOnClick={onInfoPanelIconClick}
                  />
               )}
            </div>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
               {translations("messageForVersion")} {version}
               {versionTagName && versionTagName !== "undefined"
                  ? `, ${versionTagName}`
                  : ""}
            </span>
         </div>
      </div>
   );
}

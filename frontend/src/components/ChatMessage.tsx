import { formatDate } from "@/lib/formatDate";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import InfoLabel from "./InfoLabel";

export default function ChatMessage({
   creator,
   timestamp,
   version,
   versionTagName,
   message,
   onInfoPanelIconClick
}) {
   const translations = useTranslations("chat");

   return (
      <div className="flex items-start gap-2.5">
         <div className="flex flex-col w-full leading-1.5 p-4 border-gray-200 bg-blue-200 rounded-e-xl rounded-es-xl dark:bg-gray-700">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
               <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {creator || translations("user")}
               </span>
               <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {formatDate(timestamp)}
               </span>
            </div>
            <div className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">
               {message}

               {onInfoPanelIconClick && (
                  <InfoLabel
                     text="Show point in document"
                     icon={<ExternalLink />}
                     iconOnClick={onInfoPanelIconClick}
                  />
               )}
            </div>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
               {translations("messageForVersion")} {version}
               {versionTagName ? `, ${versionTagName}` : ""}
            </span>
         </div>
      </div>
   );
}

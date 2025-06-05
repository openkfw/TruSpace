import { formatDate } from "@/app/helper/formatDate";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import InfoLabel from "./InfoLabel";
import { Button } from "./ui/button";

export default function ChatMessage({
   creator,
   timestamp,
   version,
   message,
   showMoreActions,
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
            </span>
         </div>
         {showMoreActions && (
            <>
               <Button
                  id="dropdownMenuIconButton"
                  data-dropdown-toggle="dropdownDots"
                  data-dropdown-placement="bottom-start"
                  className="inline-flex self-center items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
                  type="button"
               >
                  <svg
                     className="w-4 h-4 text-gray-500 dark:text-gray-400"
                     aria-hidden="true"
                     xmlns="http://www.w3.org/2000/svg"
                     fill="currentColor"
                     viewBox="0 0 4 15"
                  >
                     <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                  </svg>
               </Button>

               <div
                  id="dropdownDots"
                  className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-40 dark:bg-gray-700 dark:divide-gray-600"
               >
                  <ul
                     className="py-2 text-sm text-gray-700 dark:text-gray-200"
                     aria-labelledby="dropdownMenuIconButton"
                  >
                     <li>
                        <a
                           href="#"
                           className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                           {translations("reply")}
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                           {translations("forward")}
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                           {translations("copy")}
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                           {translations("report")}
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                           {translations("delete")}
                        </a>
                     </li>
                  </ul>
               </div>
            </>
         )}
      </div>
   );
}

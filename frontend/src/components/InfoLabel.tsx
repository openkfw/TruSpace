import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InfoLabel({
   text,
   secondaryText,
   icon,
   iconOnClick,
    isOwnMessage = false
}: {
   text: string;
   secondaryText?: string;
   icon?: React.ReactNode;
   iconOnClick?: () => void;
   isOwnMessage?: boolean;
}) {
   return (
     <div className={cn("flex items-center my-2.5 rounded-lg p-2",
     isOwnMessage
        ? "bg-blue-100 dark:bg-blue-700"
        : "bg-gray-200 dark:bg-gray-600"
     )}>
         <div className="me-1">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
               {text}
            </span>
            {secondaryText && (
               <span className="flex text-xs font-normal text-gray-500 dark:text-gray-400 gap-2">
                  {secondaryText}
               </span>
            )}
         </div>
         <div className="inline-flex self-center items-right ml-auto">
            {iconOnClick && (
               <button
                 className={cn("inline-flex self-center items-center p-1 text-sm font-medium text-center text-gray-900 rounded-lg focus:ring-4 focus:outline-none dark:text-white [&_svg]:h-4 [&_svg]:w-4",
                  isOwnMessage
                      ? "bg-blue-100 hover:bg-blue-50 dark:bg-blue-700 dark:hover:bg-blue-500"
                      : "bg-gray-200 hover:bg-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500"
                  )}
                  type="button"
                  onClick={iconOnClick}
               >
                  {icon || <X />}
               </button>
            )}
         </div>
      </div>
   );
}

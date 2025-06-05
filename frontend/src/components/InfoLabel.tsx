import { X } from "lucide-react";

export default function InfoLabel({
   text,
   secondaryText,
   icon,
   iconOnClick
}: {
   text: string;
   secondaryText?: string;
   icon?: React.ReactNode;
   iconOnClick?: () => void;
}) {
   return (
      <div className="flex items-center my-2.5 bg-blue-100 dark:bg-gray-600 rounded-xl p-2">
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
                  className="inline-flex self-center items-center p-2 text-sm font-medium text-center text-gray-900 bg-blue-100 rounded-lg hover:bg-blue-50 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-600"
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

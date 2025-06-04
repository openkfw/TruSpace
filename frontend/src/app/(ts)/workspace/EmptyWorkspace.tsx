"use client";
import { FilePlus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function EmptyWorkspace() {
   const translations = useTranslations("general");
   return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
         <FilePlus className="w-12 h-12 text-gray-400" />
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translations("noDocuments")}
         </h2>
         <p className="text-gray-500">
            {translations("noDocumentDescription")}
         </p>
      </div>
   );
}

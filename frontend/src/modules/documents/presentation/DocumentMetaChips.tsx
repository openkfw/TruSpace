"use client";

import { useTranslations } from "next-intl";

import { Dot, UserCircle } from "lucide-react";

import MalwareScanIndicator from "@/components/MalwareScanIndicator";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { formatDate, formatDateDays } from "@/lib/formatDate";

interface DocumentMetaChipsProps {
   meta?: {
      creatorName?: string;
      size?: number;
      timestamp?: string | number;
      malwareScanStatus?: string;
      malwareScanProvider?: string;
      malwareScanTimestamp?: string;
   };
   version?: number | string;
}

/**
 * Compact, header-friendly summary of a document's key metadata.
 * Used to promote the most-glanced metadata into the page header so the
 * dedicated Metadata panel can be collapsed by default.
 */
export default function DocumentMetaChips({
   meta,
   version
}: DocumentMetaChipsProps) {
   const generalTranslations = useTranslations("general");

   if (!meta) return null;

   const fileSize =
      typeof meta.size === "number"
         ? `${Math.round(meta.size / 10000) / 100} MB`
         : null;

   const daysAgo = meta.timestamp ? formatDateDays(meta.timestamp) : null;
   const daysAgoLabel =
      typeof daysAgo === "number"
         ? daysAgo === 0
            ? generalTranslations("today")
            : daysAgo === 1
              ? generalTranslations("yesterday")
              : `${daysAgo} ${generalTranslations("daysAgo")}`
         : null;

   return (
      <div className="flex flex-wrap items-center gap-y-1 text-sm text-muted-foreground">
         {meta.creatorName && (
            <span className="flex items-center font-medium text-foreground/80">
               <UserCircle className="h-4 w-4 mr-1.5" />
               {meta.creatorName}
            </span>
         )}
         {fileSize && (
            <>
               <Dot className="-mx-0.5 shrink-0" />
               <span>{fileSize}</span>
            </>
         )}
         {version && (
            <>
               <Dot className="-mx-0.5 shrink-0" />
               <span>v{version}</span>
            </>
         )}
         {daysAgoLabel && (
            <>
               <Dot className="-mx-0.5 shrink-0" />
               <TooltipProvider>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <span className="cursor-default">{daysAgoLabel}</span>
                     </TooltipTrigger>
                     <TooltipContent>
                        {formatDate(meta.timestamp)}
                     </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
            </>
         )}
         <Dot className="-mx-0.5 shrink-0" />
         <MalwareScanIndicator
            status={meta.malwareScanStatus}
            provider={meta.malwareScanProvider}
            timestamp={meta.malwareScanTimestamp}
         />
      </div>
   );
}

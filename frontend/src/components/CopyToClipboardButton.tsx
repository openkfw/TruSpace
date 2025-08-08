"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Check, Copy } from "lucide-react";

import { Button } from "./ui/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "./ui/tooltip";

export default function CopyToClipboardButton({ value }: { value: string }) {
   const t = useTranslations();
   const [copied, setCopied] = useState(false);

   const copyToClipboard = async () => {
      if (value) {
         try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
         } catch (err) {
            console.error("Failed to copy text: ", err);
         }
      }
   };

   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button variant="ghost" onClick={copyToClipboard}>
                  {copied ? (
                     <Check className="text-green-500" />
                  ) : (
                     <Copy className="text-gray-500" />
                  )}
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {copied ? t("general.copied") : t("general.copyToClipboard")}
            </TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}

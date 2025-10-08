"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { useTranslations } from "next-intl";

import { FileLock2, Link, Loader2, Share2, UserCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/formatDate";
import { useLanguage, useLanguageStatus } from "@/lib/services";

export default function DocumentData({
   docId,
   cId,
   meta,
   documentVersions,
   workspaceOrigin
}) {
   const translations = useTranslations("documentData");
   const langTranslations = useTranslations("languages");

   const languageDisplayMap = useMemo(
      () => ({
         English: { flag: "🇬🇧", name: langTranslations("en") },
         German: { flag: "🇩🇪", name: langTranslations("de") },
         French: { flag: "🇫🇷", name: langTranslations("fr") },
         Spanish: { flag: "🇪🇸", name: langTranslations("es") },
         Italian: { flag: "🇮🇹", name: langTranslations("it") },
         Portuguese: { flag: "🇵🇹", name: langTranslations("pt") },
         Russian: { flag: "🇷🇺", name: langTranslations("ru") },
         Chinese: { flag: "🇨🇳", name: langTranslations("zh") }
      }),
      [langTranslations]
   );

   const [copyButtonTooltipText, setCopyButtonTooltipText] =
      useState<string>("");
   const [shareButtonTooltipText, setShareButtonTooltipText] =
      useState<string>("");

   const { status: languageStatus } = useLanguageStatus(cId);

   const {
      language: documentLanguage,
      error: documentLanguageError,
      refresh: documentLanguageRefresh
   } = useLanguage(cId);

   const isGenerating =
      languageStatus?.status === "processing" ||
      languageStatus?.status === "pending";
   const isPending = languageStatus?.status === "pending";

   useEffect(() => {
      if (languageStatus?.status === "failed") {
         toast.error(translations("languageGenerationError"));
      }
   }, [languageStatus, translations]);

   const linkInput = useRef(null);

   const uniqueContributors = documentVersions.reduce((acc, version) => {
      if (acc.includes(version.meta.creatorUiid)) {
         return acc;
      }
      return [...acc, version.meta.creatorUiid];
   }, []);

   const copyLink = () => {
      const copyText = linkInput.current;
      copyText.select();
      copyText.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(copyText.value);

      setCopyButtonTooltipText(translations("linkCopied"));
      setTimeout(() => setCopyButtonTooltipText(""), 2000);
   };

   const shareLink = () => {
      const url = `${window.location.origin}/workspace/${workspaceOrigin}/document/${docId}`;
      const emailSubject = `${translations("shareLinkEmailSubject")} ${meta?.filename.replace("TruSpace - ", "")}`;
      const emailBody = `\n-----\n${meta?.filename.replace("TruSpace - ", "")}\n\n${translations("shareLinkEmailBody1")}\n${url}\n\n${translations("shareLinkEmailBody2")}\n-----\n`;

      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      setShareButtonTooltipText(translations("linkShared"));
      setTimeout(() => setShareButtonTooltipText(""), 2000);
  };

   const isRichTextDocument = meta?.filename?.endsWith(".editableFile");

   const [displayLanguage, setDisplayLanguage] = useState<string>("");

   useEffect(() => {
      let langToSet = "-";
      let usedSource = "default (or not found)";

      // Priority 1: meta.language (from component props)
      if (typeof meta?.language === "string" && meta.language.trim() !== "") {
         const trimmedLang = meta.language.trim();
         const normalizedMetaLang =
            trimmedLang.charAt(0).toUpperCase() +
            trimmedLang.slice(1).toLowerCase();

         if (languageDisplayMap[normalizedMetaLang]) {
            langToSet = `${languageDisplayMap[normalizedMetaLang].flag} ${languageDisplayMap[normalizedMetaLang].name}`;
            usedSource = "meta.language (props)";
         }
      }

      // Priority 2: documentLanguage (AI-detected)
      // Only if meta.language was not found or not used.
      if (
         usedSource === "default (or not found)" &&
         typeof documentLanguage === "string" &&
         documentLanguage.trim() !== ""
      ) {
         const normalizedDocLang =
            documentLanguage.charAt(0).toUpperCase() +
            documentLanguage.slice(1).toLowerCase();

         if (languageDisplayMap[normalizedDocLang]) {
            langToSet = `${languageDisplayMap[normalizedDocLang].flag} ${languageDisplayMap[normalizedDocLang].name}`;
            usedSource = "documentLanguage (AI)";
         }
      }

      setDisplayLanguage(langToSet);
   }, [
      meta?.language,
      documentLanguage,
      languageDisplayMap,
      documentLanguageError
   ]);

   // trigger refresh when new data is available
   useEffect(() => {
      if (
         cId &&
         (languageStatus?.status === "completed" ||
            languageStatus?.status === "failed")
      ) {
         documentLanguageRefresh();
      }
   }, [languageStatus?.status, documentLanguageRefresh, cId]);

   return (
      <div className="space-y-6 md:w-full">
         <div className="grid grid-cols-[2fr_1fr] gap-y-6">
            <div className="font-bold">{translations("docName")}</div>
            <div>
               {isRichTextDocument
                  ? meta?.filename.slice(0, -13)
                  : meta?.filename}
            </div>
            <div className="font-bold">{translations("documentSize")}</div>
            <div>
               {meta?.size ? Math.round(meta?.size / 10000) / 100 + " MB" : "-"}
            </div>
            <div className="font-bold">{translations("documentLanguages")}</div>
            <div>
               {isGenerating ? (
                  <div className="flex items-center">
                     <Loader2 className="animate-spin h-5 w-5 mr-2" />
                     <span>
                        {isPending
                           ? `${translations("generatingAILanguageQueue")}`
                           : translations("generatingAILanguage")}
                     </span>
                  </div>
               ) : (
                  <span>{displayLanguage}</span>
               )}
            </div>
            <div className="font-bold">{translations("docLink")}</div>
            <div className="break-words flex gap-2 mr-2">
               <Input
                  type="text"
                  value={`${window.location.origin}/workspace/${workspaceOrigin}/document/${docId}`}
                  className="hidden"
                  ref={linkInput}
                  readOnly
               />
               <TooltipProvider>
                  <Tooltip open={copyButtonTooltipText !== ""}>
                     <TooltipTrigger asChild>
                        <Button
                           variant="secondary"
                           className="text-left"
                           onClick={copyLink}
                        >
                           <Link />
                           {translations("copyLink")}
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{copyButtonTooltipText}</TooltipContent>
                  </Tooltip>
               </TooltipProvider>
               <TooltipProvider>
                 <Tooltip open={shareButtonTooltipText !== ""}>
                   <TooltipTrigger asChild>
                     <Button
                        variant="secondary"
                        className="text-left"
                        onClick={shareLink}
                     >
                       <Share2 />
                       {translations("shareLink")}
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent>{shareButtonTooltipText}</TooltipContent>
                 </Tooltip>
                </TooltipProvider>
            </div>
            <div className="font-bold">{translations("contributors")}</div>
            <div className="flex flex-wrap gap-2">
               {uniqueContributors.map((contributor, index) => (
                  <Badge key={index}>
                     <UserCircle className="mr-2" />
                     {
                        documentVersions.find(
                           (version) => version.meta.creatorUiid === contributor
                        ).meta.creator
                     }
                  </Badge>
               ))}
            </div>
            <div className="font-bold">{translations("documentSecurity")}</div>
            <div>
               <Badge className="bg-violet-600">
                  <FileLock2 className="mr-2" />
                  {translations("encrypted")}
               </Badge>
            </div>
            <div className="font-bold">{translations("creator")}</div>
            <div>{meta?.creator}</div>

            <div className="font-bold">{translations("createdAt")}</div>
            <div>{formatDate(meta?.timestamp)}</div>
         </div>
      </div>
   );
}

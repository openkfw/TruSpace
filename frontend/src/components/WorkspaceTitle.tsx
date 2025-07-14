"use client";
import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Calendar, Files, Lock, LockOpen, User, Users } from "lucide-react";

import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { loadWorkspaceContributors } from "@/lib/services";

const fmtCreatedOn = (isoString) => {
   if (!isoString) return "n/a";

   const date = new Date(isoString);
   return isNaN(date.getTime()) ? "n/a" : date.toLocaleDateString();
};

export default function WorkspaceTitle() {
   const { workspace } = useWorkspaceContext();
   const { documents } = useDocuments();
   const [contributors, setContributors] = useState({
      count: 0,
      contributors: []
   });
   const translations = useTranslations("homePage");
   const documentCount = documents.length;

   useEffect(() => {
      const getWorkspaceContributors = async () => {
         const data = await loadWorkspaceContributors(
            workspace?.meta.workspace_uuid
         );
         setContributors(data);
      };
      if (workspace?.meta.workspace_uuid) {
         getWorkspaceContributors();
      }
   }, [setContributors, workspace?.meta.workspace_uuid]);

   return (
      <div className="min-w-0 flex-1">
         <h1 className="text-2xl/7 font-bold break-words sm:text-3xl sm:tracking-tight">
            {workspace?.meta?.name}
         </h1>
         <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
               {workspace?.meta?.is_public ? (
                  <LockOpen className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               ) : (
                  <Lock className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               )}
               {workspace?.meta?.is_public
                  ? translations("public")
                  : translations("private")}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
               <Files className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               {documentCount} {translations("documents")}
               {/* TODO update of api to get the count of docs */}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
               <User className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               {translations("createdBy")} {workspace?.meta?.creator_name}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
               <Users className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               {contributors.count}{" "}
               {contributors.count === 1
                  ? translations("participant")
                  : translations("participants")}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
               <Calendar className="mr-1.5 size-5 shrink-0 text-gray-500 dark:text-gray-400" />
               {translations("createdOn")} {}
               {fmtCreatedOn(workspace?.meta?.created_at)}
            </div>
         </div>
      </div>
   );
}

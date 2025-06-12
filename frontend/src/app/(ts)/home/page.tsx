"use client";
import { useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import DocumentList from "@/components/DocumentList";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export default function Home() {
   const { slug } = useParams();
   const router = useRouter();
   const { availableWorkspaces, workspacesLoading } = useWorkspaceContext();

   useEffect(() => {
      function checkWorkspaces() {
         if (!workspacesLoading) {
            if (availableWorkspaces.length === 0) {
               router.push("/dashboard");
            }
         }
      }

      checkWorkspaces();
   }, [router, availableWorkspaces, workspacesLoading]);

   return (
      <div>
         <DocumentList workspaceId={slug} />
      </div>
   );
}

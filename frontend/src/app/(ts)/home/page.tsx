"use client";
import DocumentList from "@/components/DocumentList";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home({
   params
}: {
   params: Promise<{ slug: string }>;
}) {
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

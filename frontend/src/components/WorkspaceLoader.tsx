"use client";
import { useEffect } from "react";

import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { loadWorkspaces } from "@/lib/services";

const WorkspaceLoader = () => {
   const { setAvailableWorkspaces, setWorkspacesLoading } =
      useWorkspaceContext();

   useEffect(() => {
      const fetchWorkspaces = async () => {
         setWorkspacesLoading(true);
         const workspaces = await loadWorkspaces();
         if ((workspaces as { status?: unknown })?.status === "failure") {
            setAvailableWorkspaces([]);
         } else {
            setAvailableWorkspaces(workspaces);
         }
         setWorkspacesLoading(false);
      };

      fetchWorkspaces();
   }, [setAvailableWorkspaces, setWorkspacesLoading]);

   return null;
};

export default WorkspaceLoader;

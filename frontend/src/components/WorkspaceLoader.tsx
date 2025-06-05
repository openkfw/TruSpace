"use client";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { loadWorkspaces } from "@/lib/services";
import { useEffect } from "react";

const WorkspaceLoader = () => {
   const { setAvailableWorkspaces, setWorkspacesLoading } =
      useWorkspaceContext();

   useEffect(() => {
      const fetchWorkspaces = async () => {
         setWorkspacesLoading(true);
         const workspaces = await loadWorkspaces();
         if ((workspaces as any)?.status === "failure") {
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

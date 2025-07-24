"use client";
import { useEffect } from "react";

import { useUser } from "@/contexts/UserContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { loadWorkspaces } from "@/lib/services";

const POLL_INTERVAL = 30000; // 30 seconds

const WorkspaceLoader = () => {
   const { isLoggedIn } = useUser();
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

   // Poll workspaces every POLL_INTERVAL seconds
   useEffect(() => {
      if (isLoggedIn) {
         const interval = setInterval(async () => {
            const workspaces = await loadWorkspaces();
            if ((workspaces as { status?: unknown })?.status !== "failure") {
               setAvailableWorkspaces(workspaces);
            }
         }, POLL_INTERVAL);

         return () => clearInterval(interval);
      }
   }, [isLoggedIn, setAvailableWorkspaces]);

   return null;
};

export default WorkspaceLoader;

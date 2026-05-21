"use client";

import { useUser } from "@/contexts/UserContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspacePolling } from "@/modules/workspaces";

const WorkspaceLoader = () => {
   const { isLoggedIn } = useUser();
   const { setAvailableWorkspaces, setWorkspacesLoading } =
      useWorkspaceContext();

   useWorkspacePolling({
      isLoggedIn,
      setAvailableWorkspaces,
      setWorkspacesLoading
   });

   return null;
};

export default WorkspaceLoader;

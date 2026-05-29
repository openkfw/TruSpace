"use client";

import {
   type Dispatch,
   type SetStateAction,
   useCallback,
   useEffect,
   useRef,
   useState
} from "react";

import type { Workspace } from "../domain";

import {
   findWorkspaceById,
   findWorkspaceByName,
   loadWorkspaceCollection,
   pollUntilWorkspaceAvailable
} from "./workspace-loading.utils";

export interface UseWorkspaceStateResult {
   workspace: Workspace | null;
   setWorkspace: Dispatch<SetStateAction<Workspace | null>>;
   availableWorkspaces: Workspace[];
   setAvailableWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
   workspacesLoading: boolean;
   setWorkspacesLoading: Dispatch<SetStateAction<boolean>>;
   refresh: (workspaceName: string) => Promise<void>;
}

const isWorkspaceRoute = (pathname: string) => {
   return pathname.split("/").filter((segment) => segment !== "")[0] === "workspace";
};

export const useWorkspaceState = ({
   pathname,
   workspaceId
}: {
   pathname: string;
   workspaceId?: string;
}): UseWorkspaceStateResult => {
   const [workspace, setWorkspace] = useState<Workspace | null>(null);
   const [workspacesLoading, setWorkspacesLoading] = useState(true);
   const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>(
      []
   );
   const refreshPollingCleanup = useRef<(() => void) | null>(null);

   const clearRefreshPolling = useCallback(() => {
      refreshPollingCleanup.current?.();
      refreshPollingCleanup.current = null;
   }, []);

   useEffect(() => {
      if (!isWorkspaceRoute(pathname) || availableWorkspaces.length === 0) {
         return;
      }

      const foundWorkspace = findWorkspaceById(availableWorkspaces, workspaceId);

      if (foundWorkspace) {
         setWorkspace(foundWorkspace);
      }
   }, [availableWorkspaces, pathname, workspaceId]);

   useEffect(() => {
      return () => {
         clearRefreshPolling();
      };
   }, [clearRefreshPolling]);

   const refresh = useCallback(
      async (workspaceName: string) => {
         setWorkspacesLoading(true);

         const workspaces = await loadWorkspaceCollection();
         const foundWorkspace = findWorkspaceByName(workspaces, workspaceName);

         setAvailableWorkspaces(workspaces);
         clearRefreshPolling();

         if (foundWorkspace || !workspaceName) {
            setWorkspacesLoading(false);
            return;
         }

         refreshPollingCleanup.current = pollUntilWorkspaceAvailable({
            workspaceName,
            onUpdate: setAvailableWorkspaces,
            onFinish: () => {
               clearRefreshPolling();
               setWorkspacesLoading(false);
            }
         });
      },
      [clearRefreshPolling]
   );

   return {
      workspace,
      setWorkspace,
      availableWorkspaces,
      setAvailableWorkspaces,
      workspacesLoading,
      setWorkspacesLoading,
      refresh
   };
};

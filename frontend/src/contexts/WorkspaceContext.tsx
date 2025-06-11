"use client";

import {
   createContext,
   type Dispatch,
   type ReactNode,
   type SetStateAction,
   useCallback,
   useContext,
   useEffect,
   useState} from "react";

import { useParams, usePathname } from "next/navigation";

import { Workspace } from "@/interfaces";
import { loadWorkspaces } from "@/lib/services";

interface WorkspaceContextType {
   workspace: Workspace | null;
   setWorkspace: Dispatch<SetStateAction<Workspace | null>>;
   availableWorkspaces: Workspace[] | null;
   setAvailableWorkspaces: (workspaces: Workspace[]) => void;
   workspacesLoading: boolean;
   setWorkspacesLoading: Dispatch<SetStateAction<boolean>>;
   refresh: (workspaceName: string) => Promise<() => void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
   workspace: null,
   setWorkspace: () => null,
   availableWorkspaces: [],
   setAvailableWorkspaces: () => null,
   workspacesLoading: true,
   setWorkspacesLoading: () => null,
   refresh: () => null
});

export const useWorkspaceContext = () => {
   const context = useContext(WorkspaceContext);
   if (!context) {
      throw new Error("useWorkspace must be used within a WorkspaceProvider");
   }
   return context;
};

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
   const pathname = usePathname();
   const params = useParams();
   const [workspace, setWorkspace] = useState<Workspace | null>(null);
   const [workspacesLoading, setWorkspacesLoading] = useState(true);
   const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>(
      []
   );

   useEffect(() => {
      if (pathname.split("/").filter((el) => el !== "")[0] === "workspace") {
         const workspaceId = params?.workspaceId;
         if (
            workspaceId &&
            typeof workspaceId === "string" &&
            availableWorkspaces.length > 0
         ) {
            const found = availableWorkspaces.find(
               (w) => w.uuid === workspaceId
            );
            if (found) {
               setWorkspace(found);
            }
         }
      }
   }, [pathname, params?.workspaceId, availableWorkspaces]);

   const refresh = useCallback(
      async (workspaceName: string) => {
         setWorkspacesLoading(true);

         const findWorkspace = (workspaces) => {
            return workspaces.find(
               (workspace) =>
                  workspace.meta && workspace.meta.name === workspaceName
            );
         };

         let workspaces = await loadWorkspaces();
         let foundWorkspace = findWorkspace(workspaces);

         setAvailableWorkspaces(workspaces);

         if (!foundWorkspace) {
            const pollInterval = setInterval(async () => {
               try {
                  workspaces = await loadWorkspaces();
                  foundWorkspace = findWorkspace(workspaces);

                  setAvailableWorkspaces(workspaces);

                  if (foundWorkspace) {
                     clearInterval(pollInterval);
                     setWorkspacesLoading(false);
                  }
               } catch (error) {
                  console.error("Error polling for workspaces:", error);
                  clearInterval(pollInterval);
                  setWorkspacesLoading(false);
               }
            }, 2000);

            setTimeout(() => {
               if (pollInterval) {
                  clearInterval(pollInterval);
                  setWorkspacesLoading(false);
                  console.log(`Workspace "${workspaceName}" not found.`);
               }
            }, 30000);

            return () => {
               clearInterval(pollInterval);
               setWorkspacesLoading(false);
            };
         } else {
            setWorkspacesLoading(false);
         }
      },
      [setAvailableWorkspaces, setWorkspacesLoading]
   );

   return (
      <WorkspaceContext.Provider
         value={{
            workspace,
            setWorkspace,
            availableWorkspaces,
            setAvailableWorkspaces,
            workspacesLoading,
            setWorkspacesLoading,
            refresh
         }}
      >
         {children}
      </WorkspaceContext.Provider>
   );
};

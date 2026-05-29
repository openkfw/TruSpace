"use client";

import {
   createContext,
   type Dispatch,
   type ReactNode,
   type SetStateAction,
   useContext
} from "react";

import { useParams, usePathname } from "next/navigation";

import { useWorkspaceState } from "../application";
import type { Workspace } from "../domain";

export interface WorkspaceContextType {
   workspace: Workspace | null;
   setWorkspace: Dispatch<SetStateAction<Workspace | null>>;
   availableWorkspaces: Workspace[];
   setAvailableWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
   workspacesLoading: boolean;
   setWorkspacesLoading: Dispatch<SetStateAction<boolean>>;
   refresh: (workspaceName: string) => Promise<void>;
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
   const workspaceId =
      typeof params?.workspaceId === "string" ? params.workspaceId : undefined;
   const value = useWorkspaceState({
      pathname,
      workspaceId
   });

   return (
      <WorkspaceContext.Provider value={value}>
         {children}
      </WorkspaceContext.Provider>
   );
};

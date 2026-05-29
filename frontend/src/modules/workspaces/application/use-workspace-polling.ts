"use client";

import {
   type Dispatch,
   type SetStateAction,
   useEffect
} from "react";

import type { Workspace } from "../domain";

import {
   loadWorkspaceCollection,
   startWorkspaceCollectionPolling
} from "./workspace-loading.utils";

export const useWorkspacePolling = ({
   isLoggedIn,
   setAvailableWorkspaces,
   setWorkspacesLoading
}: {
   isLoggedIn: boolean;
   setAvailableWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
   setWorkspacesLoading: Dispatch<SetStateAction<boolean>>;
}) => {
   useEffect(() => {
      const loadInitialWorkspaces = async () => {
         setWorkspacesLoading(true);
         const workspaces = await loadWorkspaceCollection();
         setAvailableWorkspaces(workspaces);
         setWorkspacesLoading(false);
      };

      void loadInitialWorkspaces();
   }, [setAvailableWorkspaces, setWorkspacesLoading]);

   useEffect(() => {
      if (!isLoggedIn) {
         return;
      }

      return startWorkspaceCollectionPolling((workspaces) => {
         setAvailableWorkspaces(workspaces);
      });
   }, [isLoggedIn, setAvailableWorkspaces]);
};

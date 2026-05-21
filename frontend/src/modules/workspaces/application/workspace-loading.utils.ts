import type { Workspace } from "../domain";
import { loadWorkspaces } from "../infrastructure";

const WORKSPACE_REFRESH_POLL_INTERVAL_MS = 2000;
const WORKSPACE_REFRESH_TIMEOUT_MS = 30000;
export const WORKSPACE_LIST_POLL_INTERVAL_MS = 30000;

const isWorkspaceFailureResponse = (
   value: unknown
): value is { status: string } => {
   return (
      typeof value === "object" &&
      value !== null &&
      "status" in value &&
      value.status === "failure"
   );
};

export const fetchWorkspaceCollection = async (): Promise<Workspace[] | null> => {
   const response = (await loadWorkspaces()) as unknown;

   if (isWorkspaceFailureResponse(response)) {
      return null;
   }

   return response as Workspace[];
};

export const loadWorkspaceCollection = async (): Promise<Workspace[]> => {
   return (await fetchWorkspaceCollection()) ?? [];
};

export const findWorkspaceById = (
   workspaces: Workspace[],
   workspaceId?: string
) => {
   if (!workspaceId) {
      return null;
   }

   return workspaces.find((workspace) => workspace.uuid === workspaceId) ?? null;
};

export const findWorkspaceByName = (
   workspaces: Workspace[],
   workspaceName: string
) => {
   if (!workspaceName) {
      return null;
   }

   return (
      workspaces.find((workspace) => workspace.meta?.name === workspaceName) ??
      null
   );
};

export const pollUntilWorkspaceAvailable = ({
   workspaceName,
   onUpdate,
   onFinish
}: {
   workspaceName: string;
   onUpdate: (workspaces: Workspace[]) => void;
   onFinish: () => void;
}) => {
   const cleanup = () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
   };

   const intervalId = window.setInterval(async () => {
      try {
         const workspaces = await fetchWorkspaceCollection();

         if (!workspaces) {
            return;
         }

         onUpdate(workspaces);

         if (findWorkspaceByName(workspaces, workspaceName)) {
            cleanup();
            onFinish();
         }
      } catch (error) {
         console.error("Error polling for workspaces:", error);
         cleanup();
         onFinish();
      }
   }, WORKSPACE_REFRESH_POLL_INTERVAL_MS);

   const timeoutId = window.setTimeout(() => {
      cleanup();
      onFinish();
   }, WORKSPACE_REFRESH_TIMEOUT_MS);

   return cleanup;
};

export const startWorkspaceCollectionPolling = (
   onUpdate: (workspaces: Workspace[]) => void
) => {
   const intervalId = window.setInterval(async () => {
      try {
         const workspaces = await fetchWorkspaceCollection();

         if (!workspaces) {
            return;
         }

         onUpdate(workspaces);
      } catch (error) {
         console.error("Error polling workspaces:", error);
      }
   }, WORKSPACE_LIST_POLL_INTERVAL_MS);

   return () => {
      window.clearInterval(intervalId);
   };
};

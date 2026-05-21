import useSWR from "swr";

import {
   CHATS_ENDPOINT,
   DOCUMENTS_ENDPOINT,
   HEALTH_ENDPOINT,
   LANGUAGE_ENDPOINT,
   PERSPECTIVES_ENDPOINT,
   TAGS_ENDPOINT,
   USERS_ENDPOINT
} from "@/shared/config";
import {
   fetchWithCredentials,
   swrJsonFetcher
} from "@/shared/infrastructure/http";
export {
   getChatsPdfExportUrl,
   loadChats,
   postChat
} from "@/modules/chats/infrastructure";
export {
   deleteDocument,
   documentUpload,
   loadAllDocuments,
   loadDocumentBlob,
   loadDocumentDetail,
   loadDocuments
} from "@/modules/documents/infrastructure";
export {
   getHealth
} from "@/modules/health/infrastructure";
export {
   createPerspective,
   customPerspective
} from "@/modules/perspectives/infrastructure";
export {
   deleteTag,
   loadTags,
   postTag
} from "@/modules/tags/infrastructure";
export {
   createWorkspace,
   deleteWorkspace,
   loadWorkspaceContributors,
   loadWorkspaces,
   updateWorkspaceType
} from "@/modules/workspaces/infrastructure";

// Perspectives api

export const usePerspectives = (cid: string) => {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${PERSPECTIVES_ENDPOINT}/version/${cid}`,
      swrJsonFetcher
   );

   return {
      perspectives: data
         ?.map((perspective) => ({
            id: perspective.cid,
            name: perspective.meta.perspectiveType,
            text: perspective.meta.data,
            creatorType: perspective.meta.creatorType,
            creatorName: perspective.meta.creatorName,
            creatorUserId: perspective.meta.creatorUserId,
            model: perspective.meta.model,
            prompt: perspective.meta.prompt,
            timestamp: perspective.meta.timestamp
         }))
         .sort(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any, b: any) =>
               Number(new Date(a.timestamp).getTime()) -
               Number(new Date(b.timestamp).getTime())
         ),
      error,
      isLoading,
      isValidating,
      mutate
   };
};

export function usePerspectivesStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${PERSPECTIVES_ENDPOINT}/status/req_perspectives_${cid}`,
      async (url) => {
         if (cid) {
            const res = await fetchWithCredentials(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch status");
            return res.json();
         }
      },
      {
         refreshInterval: (data) => {
            return data?.status === "processing" || data?.status === "pending"
               ? 10000
               : 0;
         },
         revalidateOnFocus: false,
         shouldRetryOnError: true,
         dedupingInterval: 1000,
         onErrorRetry(error, _key, _config, _revalidate, _revalidateOpts) {
            if (error.status === 404) return;
         }
      }
   );

   return { status: data, error, refresh: mutate };
}

export function useLanguageStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${LANGUAGE_ENDPOINT}/status/req_language_${cid}`,
      async (url) => {
         if (cid) {
            const res = await fetchWithCredentials(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch status");
            return res.json();
         }
      },
      {
         refreshInterval: (data) => {
            return data?.status === "processing" || data?.status === "pending"
               ? 5000
               : 0;
         },
         revalidateOnFocus: false,
         shouldRetryOnError: true,
         dedupingInterval: 1000,
         onErrorRetry(error, _key, _config, _revalidate, _revalidateOpts) {
            if (error.status === 404) return;
         }
      }
   );

   return { status: data, error, refresh: mutate };
}

export const useLanguage = (cid: string) => {
   const { data, error, mutate } = useSWR(
      cid ? `${LANGUAGE_ENDPOINT}/${cid}` : null,
      swrJsonFetcher
   );

   return {
      language: typeof data === "string" ? data : undefined,
      error,
      refresh: mutate
   };
};

export function useTagsStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${TAGS_ENDPOINT}/status/req_tags_${cid}`,
      async (url) => {
         if (cid) {
            const res = await fetchWithCredentials(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch status");
            return res.json();
         }
      },
      {
         refreshInterval: (data) => {
            return data?.status === "processing" || data?.status === "pending"
               ? 10000
               : 0;
         },
         revalidateOnFocus: false,
         shouldRetryOnError: true,
         dedupingInterval: 1000,
         onErrorRetry(error, _key, _config, _revalidate, _revalidateOpts) {
            if (error.status === 404) return;
         }
      }
   );

   return { status: data, error, refresh: mutate };
}

export {
   deleteUserPermission,
   getUsersInWorkspace,
   postPermission,
   removeAllUserPermissions
} from "@/modules/permissions/infrastructure";
export {
   confirmRegistration,
   deleteUser,
   downloadAvatar,
   downloadAvatarCid,
   downloadUserSettings,
   forgotPassword,
   loginUser,
   logout,
   registerUser,
   resetPassword,
   updateUserName,
   updateUserSettings
} from "@/modules/users/infrastructure";

export function useDocumentsStatistics() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${DOCUMENTS_ENDPOINT}/statistics`,
      swrJsonFetcher
   );
   return {
      statistics: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export function useUsersStatistics() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${USERS_ENDPOINT}/statistics`,
      swrJsonFetcher
   );
   return {
      statistics: data?.data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export function usePeers() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${HEALTH_ENDPOINT}/peers`,
      swrJsonFetcher
   );
   return {
      peers: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export function useHealth() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${HEALTH_ENDPOINT}`,
      swrJsonFetcher
   );
   return {
      health: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export function useRecentChats() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${CHATS_ENDPOINT}/recent`,
      swrJsonFetcher
   );
   return {
      chats: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

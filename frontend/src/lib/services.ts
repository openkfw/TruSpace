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
   swrJsonFetcher,
   withCsrf
} from "@/shared/infrastructure/http";
export {
   deleteDocument,
   documentUpload,
   loadAllDocuments,
   loadDocumentBlob,
   loadDocumentDetail,
   loadDocuments
} from "@/modules/documents/infrastructure";
export {
   createWorkspace,
   deleteWorkspace,
   loadWorkspaceContributors,
   loadWorkspaces,
   updateWorkspaceType
} from "@/modules/workspaces/infrastructure";

// Perspectives api

export const createPerspective = async (formData, errorText) => {
   const url = `${PERSPECTIVES_ENDPOINT}`;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const customPerspective = async (formData, errorText) => {
   const url = `${PERSPECTIVES_ENDPOINT}/generate-custom`;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

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

// Chats api

export const loadChats = async (docId: string, errorText) => {
   const url = `${CHATS_ENDPOINT}/${docId}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };

   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const getChatsPdfExportUrl = async (docId: string) => {
   try {
      const response = await fetchWithCredentials(`${CHATS_ENDPOINT}/export/${docId}`, {
         credentials: "include"
      });
      if (!response.ok) {
         throw new Error("Failed to generate PDF");
      }
      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      return url;
   } catch (err) {
      console.error(err);
      throw new Error("Failed to generate PDF");
   }
};

export const postChat = async (formData, errorText) => {
   const url = CHATS_ENDPOINT;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const res = await fetchWithCredentials(url, withCsrf(options));
   if (!res.ok) {
      throw new Error(errorText);
   }
};

// Tags api

export const loadTags = async (cid: string) => {
   const url = `${TAGS_ENDPOINT}/version/${cid}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };

   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      throw new Error("Failed to fetch tags");
   }
   const data = await response.json();
   return data;
};

export const postTag = async (formData, cid: string) => {
   const url = `${TAGS_ENDPOINT}/version/${cid}`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         name: formData.name,
         color: formData.color,
         workspaceOrigin: formData.workspaceOrigin,
         docId: formData.docId
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error("Failed to add tag");
   }
   const data = await response.json();
   return data;
};

export const deleteTag = async (tagId: string) => {
   const url = `${TAGS_ENDPOINT}/${tagId}`;
   const options: RequestInit = {
      method: "DELETE",
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error("Failed to delete tag");
   }
   const data = await response.json();
   return data;
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

export async function getHealth() {
   const url = `${HEALTH_ENDPOINT}`;
   const response = await fetchWithCredentials(url, { credentials: "include" });
   const data = await response.json();
   return data;
}

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

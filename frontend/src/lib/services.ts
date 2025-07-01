import useSWR from "swr";

import config from "@/config";
import { Workspace } from "@/interfaces";

const fetcher = (url) =>
   fetch(url, {
      credentials: "include"
   }).then((res) => res.json());

export const getApiUrl = (): string => {
   if (typeof window !== "undefined" && window.RUNTIME_CONFIG) {
      return window.RUNTIME_CONFIG.API_URL;
   }
   return process.env.NEXT_PUBLIC_API_URL || config.apiUrl;
};

const API_URL = getApiUrl();

export const DOCUMENTS_ENDPOINT = `${API_URL}/documents`;
const PERSPECTIVES_ENDPOINT = `${API_URL}/perspectives`;
export const CHATS_ENDPOINT = `${API_URL}/chats`;
const TAGS_ENDPOINT = `${API_URL}/tags`;
const WORKSPACES_ENDPOINT = `${API_URL}/workspaces`;
export const USERS_ENDPOINT = `${API_URL}/users`;
const HEALTH_ENDPOINT = `${API_URL}/health`;
const PERMISSIONS_ENDPOINT = `${API_URL}/permissions`;
const LANGUAGE_ENDPOINT = `${API_URL}/language`;

// Documents api

export const loadDocuments = async (workspaceId, errorText) => {
   const query = workspaceId ? `?workspace=${workspaceId}` : "";
   const url = `${DOCUMENTS_ENDPOINT}${query}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      if (response.status === 401) {
         throw new Error("unauthorized");
      } else {
         throw new Error(errorText);
      }
   }
   const data = await response.json();
   return data;
};

export const loadDocumentDetail = async (documentId, errorText) => {
   const url = `${DOCUMENTS_ENDPOINT}/detail/${documentId}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const loadDocumentBlob = async (cid: string) => {
   const res = await fetch(`${DOCUMENTS_ENDPOINT}/version/${cid}`, {
      credentials: "include"
   });
   const data = res.blob();
   return data;
};

export const documentUpload = async (formData, docId, _errorText) => {
   const url = docId
      ? `${DOCUMENTS_ENDPOINT}/${docId}`
      : `${DOCUMENTS_ENDPOINT}`;
   const options: RequestInit = {
      method: docId ? "PUT" : "POST",
      body: formData,
      credentials: "include"
   };
   const res = await fetch(url, options);
   if (res.status === 413 || res.statusText === "Payload Too Large") {
      throw new Error("Payload Too Large");
   }
   const data = await res.json();
   return data;
};

export const deleteDocument = async (docId: string, errorText) => {
   const url = `${DOCUMENTS_ENDPOINT}/${docId}`;
   const options: RequestInit = {
      method: "DELETE",
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
};

// Workspace api

export const loadWorkspaces = async (): Promise<Workspace[]> => {
   const res = await fetch(WORKSPACES_ENDPOINT, {
      credentials: "include"
   });
   const data = await res.json();
   return data;
};

export const createWorkspace = async (formData, errorText) => {
   const options: RequestInit = {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
         "Content-Type": "application/json"
      },
      credentials: "include"
   };
   const res = await fetch(WORKSPACES_ENDPOINT, options);
   if (res.status === 409) {
      return res;
   } else if (!res.ok) {
      throw new Error(errorText);
   }
   return res;
};

export const loadWorkspaceContributors = async (
   wId
): Promise<{
   count: number;
   contributors: string[];
}> => {
   const res = await fetch(`${WORKSPACES_ENDPOINT}/contributors/${wId}`, {
      credentials: "include"
   });
   const data = await res.json();
   return data;
};

export const deleteWorkspace = async (
   wCID: string,
   wUID: string,
   errorText
) => {
   const url = `${WORKSPACES_ENDPOINT}/${wCID}/${wUID}`;
   const options: RequestInit = {
      method: "DELETE",
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
};

// Perspectives api

export const createPerspective = async (formData, errorText) => {
   const url = `${PERSPECTIVES_ENDPOINT}`;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const response = await fetch(url, options);
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
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const usePerspectives = (cid: string) => {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${PERSPECTIVES_ENDPOINT}/version/${cid}`,
      fetcher
   );

   return {
      perspectives: data
         ?.map((perspective) => ({
            id: perspective.cid,
            name: perspective.meta.perspectiveType,
            text: perspective.meta.data,
            creatorType: perspective.meta.creatorType,
            creator: perspective.meta.creator,
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
            const res = await fetch(url, { credentials: "include" });
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
            const res = await fetch(url, { credentials: "include" });
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
      fetcher
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

   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const getChatsPdfExportUrl = async (docId: string) => {
   try {
      const response = await fetch(`${CHATS_ENDPOINT}/export/${docId}`, {
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
   const res = await fetch(url, options);
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

   const response = await fetch(url, options);
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
   const response = await fetch(url, options);
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
   const response = await fetch(url, options);
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
            const res = await fetch(url, { credentials: "include" });
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

export const registerUser = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/register`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         name: data.name,
         email: data.email,
         password: data.password,
         confirmPassword: data.confirmPassword,
         lang: data.lang,
         confirmationLink: data.confirmationLink
      }),
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error("Failed to register user");
   }
   const result = await response.json();
   return result;
};

export const loginUser = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/login`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         email: data.email,
         password: data.password
      }),
      credentials: "include"
   };
   const response = await fetch(url, options);
   const result = await response.json();
   return result;
};

export async function getHealth() {
   const url = `${HEALTH_ENDPOINT}`;
   const response = await fetch(url, { credentials: "include" });
   const data = await response.json();
   return data;
}

export const postPermission = async (formData: {
   email: string;
   workspaceId: string;
}) => {
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         email: formData.email,
         workspaceId: formData.workspaceId
      }),
      credentials: "include"
   };
   const response = await fetch(PERMISSIONS_ENDPOINT, options);
   if (!response.ok) {
      throw new Error("Failed to add user to the workspace");
   }
   const data = await response.json();
   return data;
};

export const getUsersInWorkspace = async (workspaceId: string | string[]) => {
   const url = `${PERMISSIONS_ENDPOINT}/users-in-workspace/${workspaceId}`;
   const options: RequestInit = {
      method: "GET",
      headers: {
         "Content-Type": "application/json"
      },
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error("Failed to add user to the workspace");
   }
   const data = await response.json();
   return data;
};

export const deleteUserPermission = async (permissionId: number) => {
   const url = `${PERMISSIONS_ENDPOINT}/users-in-workspace/remove/${permissionId}`;
   const options: RequestInit = {
      method: "DELETE",
      headers: {
         "Content-Type": "application/json"
      },
      credentials: "include"
   };
   const response = await fetch(url, options);
   if (!response.ok) {
      throw new Error("Failed to remove user from the workspace");
   }
};

export function useDocumentsStatistics() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${DOCUMENTS_ENDPOINT}/statistics`,
      fetcher
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
      fetcher
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
      fetcher
   );
   return {
      peers: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export const logout = async (): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const response = await fetch(`${USERS_ENDPOINT}/logout`, {
         method: "POST",
         credentials: "include"
      });

      if (!response.ok) {
         throw new Error("Failed to log out");
      }

      return await response.json();
   } catch (error) {
      console.error("Error during logout:", error);
      throw error;
   }
};

export const confirmRegistration = async (
   token: string
): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const response = await fetch(
         `${USERS_ENDPOINT}/confirm-registration?token=${token}`,
         {
            method: "GET"
         }
      );

      if (!response.ok) {
         throw new Error("Failed to confirm registration");
      }

      return await response.json();
   } catch (error) {
      console.error("Error during registration confirmation:", error);
      throw error;
   }
};

export const uploadAvatar = async (formData: FormData) => {
   try {
      const res = await fetch(`${USERS_ENDPOINT}/avatar`, {
         method: "POST",
         credentials: "include",
         body: formData
      });

      if (!res.ok) {
         throw new Error("Failed to upload avatar");
      }
      return res.json();
   } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
   }
};

export const downloadAvatar = async () => {
   try {
      const res = await fetch(`${USERS_ENDPOINT}/avatar`, {
         method: "GET",
         credentials: "include"
      });

      if (res.status === 404) {
         // Avatar not found is expected for new users — return null
         return null;
      }

      if (!res.ok) {
         throw new Error("Failed to download avatar");
      }

      return res;
   } catch (error) {
      console.error("Error downloading avatar:", error);
      throw error;
   }
};

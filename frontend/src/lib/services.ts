import useSWR from "swr";

import {
   CHATS_ENDPOINT,
   DOCUMENTS_ENDPOINT,
   HEALTH_ENDPOINT,
   LANGUAGE_ENDPOINT,
   PERMISSIONS_ENDPOINT,
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
   const response = await fetchWithCredentials(url, withCsrf(options));
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
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

export async function getHealth() {
   const url = `${HEALTH_ENDPOINT}`;
   const response = await fetchWithCredentials(url, { credentials: "include" });
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
   const response = await fetchWithCredentials(PERMISSIONS_ENDPOINT, withCsrf(options));
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
   const response = await fetchWithCredentials(url, options);
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
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error("Failed to remove user from the workspace");
   }
};

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

export const logout = async (): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const response = await fetchWithCredentials(
         `${USERS_ENDPOINT}/logout`,
         withCsrf({
            method: "POST",
            credentials: "include"
         })
      );

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
   token: string,
   formData: {
      lang: string;
      confirmationLink: string;
   }
): Promise<{
   status: string;
   message: string;
}> => {
   try {
      const url = `${USERS_ENDPOINT}/confirm-registration?token=${token}`;
      const options: RequestInit = {
         method: "POST",
         headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify({
            lang: formData.lang,
            confirmationLink: formData.confirmationLink
         }),
         credentials: "include"
      };
      const response = await fetchWithCredentials(url, withCsrf(options));

      return await response.json();
   } catch (error) {
      console.error("Error during registration confirmation:", error);
      throw error;
   }
};

export const updateUserSettings = async (formData: FormData) => {
   try {
      const res = await fetchWithCredentials(
         `${USERS_ENDPOINT}/user-settings`,
         withCsrf({
            method: "POST",
            credentials: "include",
            body: formData
         })
      );

      if (!res.ok) {
         throw new Error("Failed to update user settings");
      }
      return res.json();
   } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
   }
};

export const updateUserName = async (name: string) => {
    try {
        const res = await fetchWithCredentials(
            `${USERS_ENDPOINT}/reset-name`,
            withCsrf({
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name })
            })
        );

        if (!res.ok) {
            throw new Error("Failed to update user name");
        }
        return res.json();
    }
    catch (error) {
        console.error("Error updating user name:", error);
        throw error;
    }
};

export const deleteUser = async () => {
    try {
        const res = await fetchWithCredentials(
            `${USERS_ENDPOINT}/delete-user`,
            withCsrf({
                method: "DELETE",
                credentials: "include"
            })
        );

        if (!res.ok) {
            throw new Error("Failed to delete user");
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    }
    catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const removeAllUserPermissions = async (email: string) => {
    try {
        const res = await fetchWithCredentials(
            `${PERMISSIONS_ENDPOINT}/user/remove-all/${encodeURIComponent(email)}`,
            withCsrf({
                method: "DELETE",
                credentials: "include"
            })
        );

        if (!res.ok) {
            throw new Error("Failed to remove user permissions");
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    }
    catch (error) {
        console.error("Error removing user permissions:", error);
        throw error;
    }
};

export const downloadAvatarCid = async () => {
   try {
      const res = await fetchWithCredentials(`${USERS_ENDPOINT}/avatar-cid`, {
         method: "GET",
         credentials: "include"
      });

      if (res.status === 404) {
         return null;
      }

      if (!res.ok) {
         throw new Error("Failed to download avatar CID");
      }

      const result = await res.json();
      return result.cid;
   } catch (error) {
      console.error("Error downloading avatar CID:", error);
      throw error;
   }
}

export const downloadAvatar = async (avatarCid: string) => {
   try {
      const res = await fetchWithCredentials(`${USERS_ENDPOINT}/avatar/${encodeURIComponent(avatarCid)}`, {
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

export const downloadUserSettings = async () => {
   try {
      const res = await fetchWithCredentials(`${USERS_ENDPOINT}/user-settings`, {
         method: "GET",
         credentials: "include"
      });

      if (res.status === 404) {
         return {};
      }

      if (!res.ok) {
         throw new Error("Failed to download user settings");
      }

      const result = await res.json();
      return result;
   } catch (error) {
      console.error("Error downloading user settings:", error);
      throw error;
   }
};

export const forgotPassword = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/forgot-password`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         email: data.email,
         resetPasswordLink: data.resetPasswordLink,
         lang: data.lang
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

export const resetPassword = async (data: Record<string, string>) => {
   const url = `${USERS_ENDPOINT}/reset-password`;
   const options: RequestInit = {
      method: "POST",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
         password: data.password,
         token: data.token
      }),
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   const result = await response.json();
   return result;
};

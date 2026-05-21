import { PERMISSIONS_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

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
   const response = await fetchWithCredentials(
      PERMISSIONS_ENDPOINT,
      withCsrf(options)
   );
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
   } catch (error) {
      console.error("Error removing user permissions:", error);
      throw error;
   }
};

import { Workspace } from "@/modules/workspaces/domain";
import {
   WORKSPACES_ENDPOINT
} from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

export const loadWorkspaces = async (): Promise<Workspace[]> => {
   const res = await fetchWithCredentials(WORKSPACES_ENDPOINT, {
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
   const res = await fetchWithCredentials(WORKSPACES_ENDPOINT, withCsrf(options));
   if (res.status === 409) {
      return res;
   } else if (!res.ok) {
      throw new Error(errorText);
   }
   return res;
};

export const updateWorkspaceType = async (
   wUID: string,
   formData: { isPublic: boolean },
   errorText: string
) => {
   const options: RequestInit = {
      method: "PUT",
      body: JSON.stringify(formData),
      headers: {
         "Content-Type": "application/json"
      },
      credentials: "include"
   };
   const res = await fetchWithCredentials(
      `${WORKSPACES_ENDPOINT}/${wUID}`,
      withCsrf(options)
   );
   if (!res.ok) {
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
   const res = await fetchWithCredentials(`${WORKSPACES_ENDPOINT}/contributors/${wId}`, {
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
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
};

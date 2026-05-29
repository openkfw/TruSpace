import { TAGS_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

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

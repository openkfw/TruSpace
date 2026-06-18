import { CHATS_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

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

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

/**
 * Edit an existing chat message. The backend keeps the original timestamp
 * and adds an `editedTimestamp` to the pin metadata; a new cid is returned
 * because IPFS content is immutable.
 */
export const editChat = async (
   cid: string,
   data: Record<string, unknown>,
   errorText: string
) => {
   const url = `${CHATS_ENDPOINT}/${encodeURIComponent(cid)}`;
   const options: RequestInit = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: JSON.stringify(data) }),
      credentials: "include"
   };
   const res = await fetchWithCredentials(url, withCsrf(options));
   if (!res.ok) {
      throw new Error(errorText);
   }
   return (await res.json()) as { cid: string };
};

/**
 * Toggle a thumbs-up like on a chat message. Likes are stored as independent
 * IPFS pins keyed by the message's stable `chatId`, so liking/unliking does
 * not rewrite the chat pin itself. The backend operations are idempotent:
 * liking an already-liked message is a no-op, as is unliking a message the
 * user hasn't liked.
 */
export const likeChat = async (chatId: string, errorText: string) => {
   const url = `${CHATS_ENDPOINT}/${encodeURIComponent(chatId)}/like`;
   const options: RequestInit = {
      method: "POST",
      credentials: "include"
   };
   const res = await fetchWithCredentials(url, withCsrf(options));
   if (!res.ok) {
      throw new Error(errorText);
   }
   return (await res.json()) as { cid: string };
};

export const unlikeChat = async (chatId: string, errorText: string) => {
   const url = `${CHATS_ENDPOINT}/${encodeURIComponent(chatId)}/like`;
   const options: RequestInit = {
      method: "DELETE",
      credentials: "include"
   };
   const res = await fetchWithCredentials(url, withCsrf(options));
   if (!res.ok) {
      throw new Error(errorText);
   }
   return (await res.json()) as { removed: boolean };
};

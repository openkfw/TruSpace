import { EVENTS_ENDPOINT } from "@/shared/config";
import { fetchWithCredentials } from "@/shared/infrastructure/http";

import { ActivityEvent } from "../domain";

export const loadEventsByDocumentId = async (
   docId: string,
   errorText: string
): Promise<ActivityEvent[]> => {
   const url = `${EVENTS_ENDPOINT}/document/${docId}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };

   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   return response.json();
};

export const loadEventsByWorkspaceId = async (
   workspaceId: string,
   errorText: string
): Promise<ActivityEvent[]> => {
   const url = `${EVENTS_ENDPOINT}/workspace/${workspaceId}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };

   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   return response.json();
};

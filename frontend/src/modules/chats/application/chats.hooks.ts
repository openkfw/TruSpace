import useSWR from "swr";

import { CHATS_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

import { ChatMessage } from "../domain";

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

/**
 * Fetch (and periodically re-fetch) the chat messages for a specific document.
 *
 * SWR gives us three things that together replace the previous manual
 * fetch + local pub/sub bus:
 * - Automatic revalidation on mount and on window focus.
 * - Background polling via `refreshInterval`, so a chat message posted on
 *   another node (or another browser) shows up here without a manual reload.
 * - `mutate` for instant local refreshes right after a write, so the author
 *   never has to wait for the next poll to see their own message.
 *
 * Pass a falsy `docId` to disable the request (SWR treats a `null` key as
 * "skip").
 */
export function useChats(docId: string | null | undefined) {
   const { data, error, isLoading, isValidating, mutate } = useSWR<
      ChatMessage[]
   >(docId ? `${CHATS_ENDPOINT}/${docId}` : null, swrJsonFetcher, {
      refreshInterval: 5000,
      // Only poll while the tab is actually visible - no background traffic
      // when the user has switched away or the browser is offline.
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 1000
   });

   return {
      chats: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

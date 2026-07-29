import useSWR from "swr";

import { EVENTS_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

import { ActivityEvent } from "../domain";

/**
 * Fetch (and periodically re-fetch) the backend-produced activity events for
 * a specific document (new versions, tag create/delete, perspective create,
 * AI generation completions, ...).
 *
 * SWR handles the parts that previously required a manual pub/sub bus:
 * - Revalidation on mount and window focus.
 * - Background polling via `refreshInterval`, so events produced on a
 *   different node (or another browser) become visible without a page reload.
 * - `mutate` for instant local refreshes right after a write.
 *
 * Pass a falsy `docId` to disable the request.
 */
export function useEventsByDocumentId(docId: string | null | undefined) {
   const { data, error, isLoading, isValidating, mutate } = useSWR<
      ActivityEvent[]
   >(
      docId ? `${EVENTS_ENDPOINT}/document/${docId}` : null,
      swrJsonFetcher,
      {
         refreshInterval: 5000,
         // Only poll while the tab is actually visible - no background
         // traffic when the user has switched away or the browser is offline.
         refreshWhenHidden: false,
         refreshWhenOffline: false,
         revalidateOnFocus: true,
         dedupingInterval: 1000
      }
   );

   return {
      events: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

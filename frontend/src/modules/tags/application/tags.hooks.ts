import useSWR from "swr";

import { TAGS_ENDPOINT } from "@/shared/config";
import { fetchWithCredentials } from "@/shared/infrastructure/http";

export function useTagsStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${TAGS_ENDPOINT}/status/req_tags_${cid}`,
      async (url) => {
         if (cid) {
            const res = await fetchWithCredentials(url, {
               credentials: "include"
            });
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
         onErrorRetry(error) {
            if (error.status === 404) return;
         }
      }
   );

   return { status: data, error, refresh: mutate };
}

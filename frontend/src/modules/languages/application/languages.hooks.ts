import useSWR from "swr";

import { LANGUAGE_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   swrJsonFetcher
} from "@/shared/infrastructure/http";

export function useLanguageStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${LANGUAGE_ENDPOINT}/status/req_language_${cid}`,
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
               ? 5000
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

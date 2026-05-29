import useSWR from "swr";

import { PERSPECTIVES_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   swrJsonFetcher
} from "@/shared/infrastructure/http";

export const usePerspectives = (cid: string) => {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${PERSPECTIVES_ENDPOINT}/version/${cid}`,
      swrJsonFetcher
   );

   return {
      perspectives: data
         ?.map((perspective) => ({
            id: perspective.cid,
            name: perspective.meta.perspectiveType,
            text: perspective.meta.data,
            creatorType: perspective.meta.creatorType,
            creatorName: perspective.meta.creatorName,
            creatorUserId: perspective.meta.creatorUserId,
            model: perspective.meta.model,
            prompt: perspective.meta.prompt,
            timestamp: perspective.meta.timestamp
         }))
         .sort(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any, b: any) =>
               Number(new Date(a.timestamp).getTime()) -
               Number(new Date(b.timestamp).getTime())
         ),
      error,
      isLoading,
      isValidating,
      mutate
   };
};

export function usePerspectivesStatus(cid: string) {
   const { data, error, mutate } = useSWR(
      `${PERSPECTIVES_ENDPOINT}/status/req_perspectives_${cid}`,
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

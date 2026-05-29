import useSWR from "swr";

import { HEALTH_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

export function usePeers() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${HEALTH_ENDPOINT}/peers`,
      swrJsonFetcher
   );

   return {
      peers: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

export function useNetworkGraph(enabled: boolean) {
   const textFetcher = (url: string) =>
      fetch(url, { credentials: "include" }).then((res) => {
         if (!res.ok) {
            throw new Error("Failed to fetch network graph");
         }

         return res.text();
      });

   const { data, error, isLoading, mutate } = useSWR(
      enabled ? `${HEALTH_ENDPOINT}/graph` : null,
      textFetcher
   );

   return {
      graph: data as string | undefined,
      error,
      isLoading,
      mutate
   };
}

export function useHealth() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${HEALTH_ENDPOINT}`,
      swrJsonFetcher
   );

   return {
      health: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

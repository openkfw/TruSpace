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

import useSWR from "swr";

import { USERS_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

export function useUsersStatistics() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${USERS_ENDPOINT}/statistics`,
      swrJsonFetcher
   );

   return {
      statistics: data?.data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

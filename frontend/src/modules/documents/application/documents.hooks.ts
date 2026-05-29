import useSWR from "swr";

import { DOCUMENTS_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

export function useDocumentsStatistics() {
   const { data, error, isLoading, isValidating, mutate } = useSWR(
      `${DOCUMENTS_ENDPOINT}/statistics`,
      swrJsonFetcher
   );

   return {
      statistics: data,
      error,
      isLoading,
      isValidating,
      mutate
   };
}

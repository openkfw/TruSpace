import useSWR from "swr";

import { CHATS_ENDPOINT } from "@/shared/config";
import { swrJsonFetcher } from "@/shared/infrastructure/http";

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

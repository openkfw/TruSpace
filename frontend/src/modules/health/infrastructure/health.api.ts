import { HEALTH_ENDPOINT } from "@/shared/config";
import { fetchWithCredentials } from "@/shared/infrastructure/http";

export async function getHealth() {
   const url = `${HEALTH_ENDPOINT}`;
   const response = await fetchWithCredentials(url, { credentials: "include" });
   const data = await response.json();
   return data;
}

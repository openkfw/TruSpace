import { getApiUrl } from "./api";

export const appConfig = {
   apiUrl: getApiUrl(),
   disableAllAIFunctionality:
      process.env.DISABLE_ALL_AI_FUNCTIONALITY === "true"
};

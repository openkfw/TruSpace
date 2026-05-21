import { PERSPECTIVES_ENDPOINT } from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

export const createPerspective = async (formData, errorText) => {
   const url = `${PERSPECTIVES_ENDPOINT}`;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const customPerspective = async (formData, errorText) => {
   const url = `${PERSPECTIVES_ENDPOINT}/generate-custom`;
   const options: RequestInit = {
      method: "POST",
      body: formData,
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

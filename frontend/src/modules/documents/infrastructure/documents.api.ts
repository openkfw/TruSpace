import {
   DOCUMENTS_ENDPOINT
} from "@/shared/config";
import {
   fetchWithCredentials,
   withCsrf
} from "@/shared/infrastructure/http";

export const loadAllDocuments = async (errorText: string) => {
   const from = 0;
   const limit = 100;
   const url = `${DOCUMENTS_ENDPOINT}?from=${from}&limit=${limit}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      if (response.status === 401) {
         throw new Error("unauthorized");
      } else {
         throw new Error(errorText);
      }
   }
   const data = await response.json();
   return data;
};

export const loadDocuments = async (
   workspaceId,
   errorText,
   from = 0,
   limit = 10,
   searchString = "",
   tagFilter: string[] = [],
   creatorFilter: string[] = [],
   sortBy: string = "timestamp",
   sortOrder: string = "desc"
) => {
   const query = workspaceId ? `&workspace=${workspaceId}` : "";
   const tagsQuery = tagFilter.map((t) => `&tags=${encodeURIComponent(t)}`).join("");
   const creatorsQuery = creatorFilter.map((c) => `&creators=${encodeURIComponent(c)}`).join("");
   const url = `${DOCUMENTS_ENDPOINT}?from=${from}&limit=${limit}${query}&search=${searchString}${tagsQuery}${creatorsQuery}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      if (response.status === 401) {
         throw new Error("unauthorized");
      } else {
         throw new Error(errorText);
      }
   }
   const data = await response.json();
   return data;
};

export const loadDocumentDetail = async (documentId, errorText) => {
   const url = `${DOCUMENTS_ENDPOINT}/detail/${documentId}`;
   const options: RequestInit = {
      method: "GET",
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, options);
   if (!response.ok) {
      throw new Error(errorText);
   }
   const data = await response.json();
   return data;
};

export const loadDocumentBlob = async (cid: string) => {
   const res = await fetchWithCredentials(`${DOCUMENTS_ENDPOINT}/version/${cid}`, {
      credentials: "include"
   });
   const data = res.blob();
   return data;
};

export const documentUpload = async (formData, docId, errorText) => {
   const url = docId
      ? `${DOCUMENTS_ENDPOINT}/${docId}`
      : `${DOCUMENTS_ENDPOINT}`;
   const options: RequestInit = {
      method: docId ? "PUT" : "POST",
      body: formData,
      credentials: "include"
   };
   const res = await fetchWithCredentials(url, withCsrf(options));
   if (res.status === 413 || res.statusText === "Payload Too Large") {
      throw new Error("Payload Too Large");
   }
   const data = await res.json().catch(() => null);
   if (!res.ok) {
      const error = new Error(data?.message || errorText) as Error & {
         code?: string;
         details?: unknown;
      };
      if (data?.error) {
         error.code = data.error;
      }
      if (data?.details) {
         error.details = data.details;
      }
      throw error;
   }
   if (!data) {
      throw new Error(errorText);
   }
   return data;
};

export const deleteDocument = async (docId: string, errorText) => {
   const url = `${DOCUMENTS_ENDPOINT}/${docId}`;
   const options: RequestInit = {
      method: "DELETE",
      credentials: "include"
   };
   const response = await fetchWithCredentials(url, withCsrf(options));
   if (!response.ok) {
      throw new Error(errorText);
   }
};

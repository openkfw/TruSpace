"use client";

import {
   createContext,
   type ReactNode,
   useContext
} from "react";

import { useTranslations } from "next-intl";

import { useDocumentsState } from "../application";
import type { Document, DocumentWithVersions } from "../domain";

export interface DocumentsContextType {
   count: number;
   allDocuments: Document[];
   documents: Document[];
   document: DocumentWithVersions | null;
   limit: number;
   setDocuments: (documents: Document[]) => void;
   fetchDocuments: (
      workspaceId: string,
      from?: number,
      limit?: number,
      searchString?: string
   ) => Promise<void>;
   fetchAllDocuments: () => Promise<void>;
   fetchDocumentDetails: (documentID: string) => Promise<void>;
   refreshUntilVersionFound: (
      docId: string,
      cid: string
   ) => Promise<void | (() => void)>;
}

export const DocumentsContext = createContext<DocumentsContextType>({
   count: 0,
   allDocuments: [],
   documents: [],
   document: null,
   limit: 10,
   setDocuments: () => null,
   fetchDocuments: async () => undefined,
   fetchAllDocuments: async () => undefined,
   fetchDocumentDetails: async () => undefined,
   refreshUntilVersionFound: async () => undefined
});

export const useDocuments = () => {
   const context = useContext(DocumentsContext);

   if (!context) {
      throw new Error("useDocuments must be used within a DocumentsProvider");
   }

   return context;
};

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
   const translations = useTranslations("homePage");
   const value = useDocumentsState({
      failedToFetchText: translations("failedToFetch")
   });

   return (
      <DocumentsContext.Provider value={value}>
         {children}
      </DocumentsContext.Provider>
   );
};

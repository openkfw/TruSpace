"use client";

import {
   createContext,
   type ReactNode,
   useCallback,
   useContext,
   useState
} from "react";

import { useTranslations } from "next-intl";

import { Document, DocumentWithVersions } from "@/interfaces";
import {
   loadAllDocuments,
   loadDocumentDetail,
   loadDocuments
} from "@/lib/services";

interface DocumentsContextType {
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
   ) => void;
   fetchAllDocuments: () => void;
   fetchDocumentDetails: (documentID: string) => void;
   refreshUntilVersionFound: (
      docId: string,
      cid: string
   ) => Promise<() => void>;
}

export const DocumentsContext = createContext<DocumentsContextType>({
   count: 0,
   allDocuments: [],
   documents: [],
   document: null,
   limit: 10,
   setDocuments: () => null,
   fetchDocuments: () => null,
   fetchAllDocuments: () => null,
   fetchDocumentDetails: () => null,
   refreshUntilVersionFound: () => null
});

export const useDocuments = () => {
   const context = useContext(DocumentsContext);
   if (!context) {
      throw new Error("useWorkspace must be used within a WorkspaceProvider");
   }
   return context;
};

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
   const [allDocuments, setAllDocuments] = useState<Document[]>([]);
   const [documents, setDocuments] = useState<Document[]>([]);
   const [count, setCount] = useState<number>(0);
   const [limit, setLimit] = useState<number>(10);
   const [document, setDocument] = useState<DocumentWithVersions>(null);
   const translations = useTranslations("homePage");

   const fetchAllDocuments = async () => {
      const data = await loadAllDocuments(translations("failedToFetch"));
      setAllDocuments(data);
   };

   const fetchDocuments = async (workspaceId, from, limitTo, searchString) => {
      const { data, count, limit } = await loadDocuments(
         workspaceId,
         translations("failedToFetch"),
         from,
         limitTo,
         searchString
      );
      setDocuments(data);
      setCount(count);
      setLimit(limit);
   };

   const fetchDocumentDetails = useCallback(
      async (documentId) => {
         const data = await loadDocumentDetail(
            documentId,
            translations("failedToFetch")
         );
         setDocument(data);
      },
      [translations]
   );

   const refreshUntilVersionFound = useCallback(
      async (docId: string, cid: string) => {
         const findDocumentVersion = (document) => {
            return document?.documentVersions.find((d) => d.cid === cid);
         };

         if (!docId) return;

         const data = await loadDocumentDetail(
            docId,
            translations("failedToFetch")
         );
         let foundDocumentVersion = findDocumentVersion(data);

         if (!foundDocumentVersion) {
            const pollInterval = setInterval(async () => {
               try {
                  const data = await loadDocumentDetail(
                     docId,
                     translations("failedToFetch")
                  );
                  foundDocumentVersion = findDocumentVersion(data);
                  if (foundDocumentVersion) {
                     clearInterval(pollInterval);
                     setDocument(data);
                  }
               } catch (error) {
                  console.error("Error polling for document version:", error);
                  clearInterval(pollInterval);
               }
            }, 5000);

            setTimeout(() => {
               if (pollInterval) {
                  clearInterval(pollInterval);
                  console.log(`Document version "${cid}" not found.`);
               }
            }, 30000);

            return () => {
               clearInterval(pollInterval);
            };
         } else {
            setDocument(data);
         }
      },
      [translations]
   );

   return (
      <DocumentsContext.Provider
         value={{
            count,
            allDocuments,
            document,
            documents,
            limit,
            setDocuments,
            fetchDocuments,
            fetchAllDocuments,
            fetchDocumentDetails,
            refreshUntilVersionFound
         }}
      >
         {children}
      </DocumentsContext.Provider>
   );
};

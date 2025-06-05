"use client";

import { Document, DocumentWithVersions } from "@/interfaces";
import { loadDocumentDetail, loadDocuments } from "@/lib/services";
import { useTranslations } from "next-intl";
import {
   createContext,
   useCallback,
   useContext,
   useState,
   type ReactNode
} from "react";

interface DocumentsContextType {
   documents: Document[];
   document: DocumentWithVersions | null;
   setDocuments: (documents: Document[]) => void;
   fetchDocuments: (workspaceId: string) => void;
   fetchDocumentDetails: (documentID: string) => void;
   refreshUntilVersionFound: (
      docId: string,
      cid: string
   ) => Promise<() => void>;
}

export const DocumentsContext = createContext<DocumentsContextType>({
   documents: [],
   document: null,
   setDocuments: () => null,
   fetchDocuments: () => null,
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
   const [documents, setDocuments] = useState<Document[]>([]);
   const [document, setDocument] = useState<DocumentWithVersions>(null);
   const translations = useTranslations("homePage");

   const fetchDocuments = async (workspaceId) => {
      const data = await loadDocuments(
         workspaceId,
         translations("failedToFetch")
      );
      setDocuments(data);
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
            document,
            documents,
            setDocuments,
            fetchDocuments,
            fetchDocumentDetails,
            refreshUntilVersionFound
         }}
      >
         {children}
      </DocumentsContext.Provider>
   );
};

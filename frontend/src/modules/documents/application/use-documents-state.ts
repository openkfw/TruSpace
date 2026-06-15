"use client";

import { useCallback, useState } from "react";

import type {
   Document,
   DocumentsResponse,
   DocumentWithVersions
} from "../domain";
import {
   loadAllDocuments,
   loadDocumentDetail,
   loadDocuments
} from "../infrastructure";

import {
   findDocumentVersionByCid,
   pollUntilDocumentVersionFound
} from "./document-polling.utils";

export interface UseDocumentsStateResult {
   count: number;
   allDocuments: Document[];
   documents: Document[];
   document: DocumentWithVersions | null;
   limit: number;
   availableTags: { name: string; color: string }[];
   availableCreators: string[];
   setDocuments: (documents: Document[]) => void;
   fetchDocuments: (
      workspaceId: string,
      from?: number,
      limit?: number,
      searchString?: string,
      tagFilter?: string[],
      creatorFilter?: string[],
      sortBy?: string,
      sortOrder?: string
   ) => Promise<void>;
   fetchAllDocuments: () => Promise<void>;
   fetchDocumentDetails: (documentId: string) => Promise<void>;
   refreshUntilVersionFound: (
      docId: string,
      cid: string
   ) => Promise<void | (() => void)>;
}

export const useDocumentsState = ({
   failedToFetchText
}: {
   failedToFetchText: string;
}): UseDocumentsStateResult => {
   const [allDocuments, setAllDocuments] = useState<Document[]>([]);
   const [documents, setDocuments] = useState<Document[]>([]);
   const [count, setCount] = useState(0);
   const [limit, setLimit] = useState(10);
   const [document, setDocument] = useState<DocumentWithVersions | null>(null);
   const [availableTags, setAvailableTags] = useState<{ name: string; color: string }[]>([]);
   const [availableCreators, setAvailableCreators] = useState<string[]>([])

   const fetchAllDocuments = useCallback(async () => {
      const response = (await loadAllDocuments(
         failedToFetchText
      )) as DocumentsResponse;
      setAllDocuments(response.data);
   }, [failedToFetchText]);

   const fetchDocuments = useCallback(
      async (
         workspaceId: string,
         from?: number,
         limitTo?: number,
         searchString?: string,
         tagFilter?: string[],
         creatorFilter?: string[],
         sortBy?: string,
         sortOrder?: string
      ) => {
         const response = (await loadDocuments(
            workspaceId,
            failedToFetchText,
            from,
            limitTo,
            searchString,
            tagFilter,
            creatorFilter,
            sortBy,
            sortOrder
         )) as DocumentsResponse;

         setDocuments(response.data);
         setCount(response.count);
         setLimit(response.limit ?? 10);
         setAvailableTags(response.availableTags ?? []);
         setAvailableCreators(response.availableCreators ?? []);
      },
      [failedToFetchText]
   );

   const fetchDocumentDetails = useCallback(
      async (documentId: string) => {
         const documentDetails = (await loadDocumentDetail(
            documentId,
            failedToFetchText
         )) as DocumentWithVersions;

         setDocument(documentDetails);
      },
      [failedToFetchText]
   );

   const refreshUntilVersionFound = useCallback(
      async (docId: string, cid: string) => {
         if (!docId) {
            return;
         }

         const documentDetails = (await loadDocumentDetail(
            docId,
            failedToFetchText
         )) as DocumentWithVersions;

         if (findDocumentVersionByCid(documentDetails, cid)) {
            setDocument(documentDetails);
            return;
         }

         return pollUntilDocumentVersionFound({
            documentId: docId,
            cid,
            errorText: failedToFetchText,
            onFound: setDocument
         });
      },
      [failedToFetchText]
   );

   return {
      count,
      allDocuments,
      documents,
      document,
      limit,
      availableTags,
      availableCreators,
      setDocuments,
      fetchDocuments,
      fetchAllDocuments,
      fetchDocumentDetails,
      refreshUntilVersionFound
   };
};

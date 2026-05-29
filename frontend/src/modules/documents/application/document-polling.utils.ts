import type { DocumentVersion, DocumentWithVersions } from "../domain";
import { loadDocumentDetail } from "../infrastructure";

const DOCUMENT_VERSION_POLL_INTERVAL_MS = 5000;
const DOCUMENT_VERSION_POLL_TIMEOUT_MS = 30000;

export const findDocumentVersionByCid = (
   document: DocumentWithVersions | null,
   cid: string
): DocumentVersion | null => {
   return (
      document?.documentVersions?.find((version) => version.cid === cid) ??
      null
   );
};

export const pollUntilDocumentVersionFound = async ({
   documentId,
   cid,
   errorText,
   onFound,
   onTimeout
}: {
   documentId: string;
   cid: string;
   errorText: string;
   onFound: (document: DocumentWithVersions) => void;
   onTimeout?: () => void;
}) => {
   const cleanup = () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
   };

   const intervalId = window.setInterval(async () => {
      try {
         const document = await loadDocumentDetail(documentId, errorText);

         if (findDocumentVersionByCid(document, cid)) {
            cleanup();
            onFound(document);
         }
      } catch (error) {
         console.error("Error polling for document version:", error);
         cleanup();
      }
   }, DOCUMENT_VERSION_POLL_INTERVAL_MS);

   const timeoutId = window.setTimeout(() => {
      cleanup();
      console.log(`Document version "${cid}" not found.`);
      onTimeout?.();
   }, DOCUMENT_VERSION_POLL_TIMEOUT_MS);

   return cleanup;
};

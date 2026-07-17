import dynamic from "next/dynamic";

import DocumentPreviewDOCX from "./DocumentPreviewDOCX";

// pdfjs-dist (via react-pdf) and the pptx renderer touch browser-only APIs
// (e.g. DOMMatrix) at module evaluation time. Loading them through
// next/dynamic with ssr disabled keeps them out of any server-side module
// graph entirely, instead of relying solely on "use client" boundaries.
const DocumentPreviewPDF = dynamic(() => import("./DocumentPreviewPDF"), {
   ssr: false
});
const DocumentPreviewPPTX = dynamic(() => import("./DocumentPreviewPPTX"), {
   ssr: false
});

export default function DocumentPreview({
   cid,
   filename,
   pageNumber,
   setPageNumber,
   newNoteVisible,
   setNewNoteVisible,
   newNotePosition,
   setNewNotePosition,
   noteVisible,
   setNoteVisible,
   notePosition,
   setNotePosition
}) {
   if (!cid || filename.split(".").pop() === "pdf") {
      return (
         <DocumentPreviewPDF
            cid={cid}
            filename={filename}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            newNoteVisible={newNoteVisible}
            setNewNoteVisible={setNewNoteVisible}
            newNotePosition={newNotePosition}
            setNewNotePosition={setNewNotePosition}
            noteVisible={noteVisible}
            setNoteVisible={setNoteVisible}
            notePosition={notePosition}
            setNotePosition={setNotePosition}
         />
      );
   }

   if (!cid || filename.split(".").pop() === "docx") {
      return <DocumentPreviewDOCX cid={cid} />;
   }

   if (!cid || filename.split(".").pop() === "pptx") {
      return <DocumentPreviewPPTX cid={cid} />;
   }

   return;
}

import DocumentPreviewDOCX from "./DocumentPreviewDOCX";
import DocumentPreviewPDF from "./DocumentPreviewPDF";

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

   return;
}

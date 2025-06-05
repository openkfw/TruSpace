import { loadDocumentBlob } from "@/lib/services";
import * as docxPreview from "docx-preview";
import { useEffect, useState } from "react";

export default function DocumentPreviewDOCX({ cid }) {
   const [docx, setDocx] = useState<Blob>();

   useEffect(() => {
      const loadFile = async () => {
         const docx = await loadDocumentBlob(cid);
         setDocx(docx);
      };
      loadFile();
   }, [cid]);

   useEffect(() => {
      if (!docx) {
         return;
      }
      const ele = document.getElementById("docx-preview");
      if (!ele) {
         return;
      }
      docxPreview.renderAsync(docx, ele, undefined, {
         ignoreWidth: false,
         className: "max-w-xl"
      });
   }, [docx]);

   return (
      <div className="h-[90vh] overflow-auto">
         <div id="docx-preview"></div>
      </div>
   );
}

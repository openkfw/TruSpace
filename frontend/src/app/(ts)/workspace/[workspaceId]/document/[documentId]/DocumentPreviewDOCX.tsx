import { useEffect, useState } from "react";

import * as docxPreview from "docx-preview";

import IPFSLoader from "@/components/IPFSLoader";
import { loadDocumentBlob } from "@/lib/services";

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

   if (!docx) {
      return <IPFSLoader />;
   }

   return (
      <div className="h-[90vh] overflow-auto">
         <div id="docx-preview" />
      </div>
   );
}

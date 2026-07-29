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
         // Let the host container drive the width instead of the document's
         // intrinsic page size — otherwise narrow viewports get a horizontal
         // scrollbar from the fixed ~8.5" Word page.
         ignoreWidth: true,
         ignoreHeight: true,
         inWrapper: true
      });
   }, [docx]);

   if (!docx) {
      return <IPFSLoader />;
   }

   return (
      <div className="w-full h-[calc(100vh-16rem)] max-h-[calc(100vh-16rem)] overflow-y-auto overflow-x-hidden">
         {/*
            docx-preview emits `.docx-wrapper > section.docx` with inline
            styles for page size and padding. Force the section to flex with
            its container so the preview never exceeds the available width.
         */}
         <div
            id="docx-preview"
            data-test-id="document-docx-preview"
            className="w-full [&_.docx-wrapper]:!w-full [&_.docx-wrapper]:!p-0 [&_.docx-wrapper]:!bg-transparent [&_.docx-wrapper>section.docx]:!w-full [&_.docx-wrapper>section.docx]:!max-w-full [&_.docx-wrapper>section.docx]:!min-w-0 [&_.docx-wrapper>section.docx]:!box-border [&_img]:!max-w-full [&_img]:!h-auto [&_table]:!max-w-full"
         />
      </div>
   );
}

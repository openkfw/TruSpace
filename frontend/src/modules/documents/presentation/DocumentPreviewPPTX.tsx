import { useEffect, useRef, useState } from "react";

import { PptxViewer, RECOMMENDED_ZIP_LIMITS } from "@aiden0z/pptx-renderer";

import IPFSLoader from "@/components/IPFSLoader";
import { loadDocumentBlob } from "@/lib/services";

export default function DocumentPreviewPPTX({ cid }) {
   const [pptx, setPptx] = useState<ArrayBuffer>();
   const containerRef = useRef<HTMLDivElement | null>(null);
   const viewerRef = useRef<PptxViewer | null>(null);

   useEffect(() => {
      const loadFile = async () => {
         const blob = await loadDocumentBlob(cid);
         const buffer = await blob.arrayBuffer();
         setPptx(buffer);
      };
      loadFile();
   }, [cid]);

   useEffect(() => {
      if (!pptx || !containerRef.current) {
         return;
      }

      let cancelled = false;
      const container = containerRef.current;
      const abortController = new AbortController();

      const render = async () => {
         const viewer = await PptxViewer.open(pptx, container, {
            zipLimits: RECOMMENDED_ZIP_LIMITS,
            fitMode: "contain",
            listOptions: { windowed: true },
            signal: abortController.signal
         });
         if (cancelled) {
            viewer.destroy();
            return;
         }
         viewerRef.current = viewer;
      };
      render();

      return () => {
         cancelled = true;
         abortController.abort();
         viewerRef.current?.destroy();
         viewerRef.current = null;
      };
   }, [pptx]);

   if (!pptx) {
      return <IPFSLoader />;
   }

   return (
      <div className="w-full h-[calc(100vh-16rem)] max-h-[calc(100vh-16rem)] overflow-y-auto overflow-x-hidden">
         <div ref={containerRef} className="w-full" />
      </div>
   );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { StickyNote } from "lucide-react";

import { DOCUMENTS_ENDPOINT } from "@/shared/config";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   "pdfjs-dist/build/pdf.worker.min.mjs",
   import.meta.url
).toString();

// Hoisted to module scope so its reference is stable across renders.
// react-pdf warns when the `options` prop reference changes between renders.
const DOCUMENT_OPTIONS = {
   withCredentials: true
} as const;

export default function DocumentPreviewPDF({
   cid,
   filename,
   pageNumber,
   setPageNumber,
   newNoteVisible,
   setNewNoteVisible,
   newNotePosition,
   setNewNotePosition,
   noteVisible,
   setNoteVisible: _setNoteVisible,
   notePosition,
   setNotePosition: _setNotePosition
}) {
   const [numPages, setNumPages] = useState<number>();
   const [containerWidth, setContainerWidth] = useState(0);
   const [indicatorPulse, setIndicatorPulse] = useState(false);

   const containerRef = useRef<HTMLDivElement | null>(null);
   const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
   const pageClickHandlersRef = useRef<
      Map<number, (ev: MouseEvent) => void>
   >(new Map());
   const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
   const intersectionRatiosRef = useRef<Map<number, number>>(new Map());
   // Marks pageNumber changes that came from the user scrolling, so the
   // "scroll target page into view" effect doesn't fight the user.
   const lastScrollDrivenPageRef = useRef<number | null>(null);

   function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
      setNumPages(numPages);
   }

   /** Compute click position as a percentage of a specific page wrapper. */
   const handlePageClick = useCallback(
      (e: React.MouseEvent<HTMLElement>, n: number) => {
         const pageEl = pageRefs.current.get(n);
         const canvas = pageEl?.querySelector("canvas");
         if (!pageEl || !canvas) {
            return;
         }
         const pageWidthPx = pageEl.clientWidth;
         const pageHeightPx = pageEl.clientHeight;
         const rect = pageEl.getBoundingClientRect();

         let x = e.clientX - rect.left;
         let y = e.clientY - rect.top;

         const iconWidth = 20;
         const iconHeight = 20;
         if (x > iconWidth) x -= iconWidth / 2;
         if (y > iconHeight) y -= iconHeight / 2;

         const xPerc = ((x / pageWidthPx) * 100).toFixed(6);
         const yPerc = ((y / pageHeightPx) * 100).toFixed(6);

         // Associate the new note with the page that was actually clicked.
         setPageNumber(n);
         setNewNotePosition({ x: xPerc, y: yPerc });
         setNewNoteVisible(true);
      },
      [setPageNumber, setNewNotePosition, setNewNoteVisible]
   );

   /** Track container width so each Page can scale to fit. */
   useEffect(() => {
      if (!containerRef.current) return;

      const updateWidth = () => {
         setContainerWidth(containerRef.current?.clientWidth ?? 0);
      };
      updateWidth();

      const resizeObserver =
         typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => updateWidth())
            : null;
      if (resizeObserver && containerRef.current) {
         resizeObserver.observe(containerRef.current);
      }
      window.addEventListener("resize", updateWidth);
      return () => {
         resizeObserver?.disconnect();
         window.removeEventListener("resize", updateWidth);
      };
   }, []);

   /** Set up an IntersectionObserver to find the most visible page. */
   useEffect(() => {
      if (!numPages || !containerRef.current) return;
      const root = containerRef.current;
      const ratios = intersectionRatiosRef.current;
      ratios.clear();

      const observer = new IntersectionObserver(
         (entries) => {
            for (const entry of entries) {
               const n = Number(
                  (entry.target as HTMLElement).dataset.pageNumber
               );
               if (n) ratios.set(n, entry.intersectionRatio);
            }
            let best = 1;
            let max = -1;
            ratios.forEach((r, n) => {
               if (r > max) {
                  max = r;
                  best = n;
               }
            });
            if (max <= 0) return;
            lastScrollDrivenPageRef.current = best;
            setPageNumber((prev: number) => (prev !== best ? best : prev));
         },
         {
            root,
            threshold: [0, 0.25, 0.5, 0.75, 1]
         }
      );
      intersectionObserverRef.current = observer;

      // Observe any pages that already mounted.
      pageRefs.current.forEach((el) => observer.observe(el));

      return () => {
         observer.disconnect();
         intersectionObserverRef.current = null;
      };
   }, [numPages, setPageNumber]);

   /** Scroll a programmatically-set page into view (e.g. clicked from chat). */
   useEffect(() => {
      if (!pageNumber) return;
      if (lastScrollDrivenPageRef.current === pageNumber) return;
      const el = pageRefs.current.get(pageNumber);
      if (el) {
         el.scrollIntoView({ block: "start", behavior: "smooth" });
      }
   }, [pageNumber, numPages]);

   /** Briefly flash the page indicator on page changes (for touch devices). */
   useEffect(() => {
      if (!pageNumber) return;
      setIndicatorPulse(true);
      const t = setTimeout(() => setIndicatorPulse(false), 1200);
      return () => clearTimeout(t);
   }, [pageNumber]);

   const setPageRef = useCallback(
      (n: number) => (el: HTMLDivElement | null) => {
         const observer = intersectionObserverRef.current;
         const existing = pageRefs.current.get(n);
         if (existing && existing !== el) {
            const oldHandler = pageClickHandlersRef.current.get(n);
            if (oldHandler) {
               existing.removeEventListener("click", oldHandler);
               pageClickHandlersRef.current.delete(n);
            }
            observer?.unobserve(existing);
            pageRefs.current.delete(n);
         }
         if (el) {
            el.dataset.pageNumber = String(n);
            const handler = (ev: MouseEvent) =>
               handlePageClick(
                  ev as unknown as React.MouseEvent<HTMLElement>,
                  n
               );
            el.addEventListener("click", handler);
            pageClickHandlersRef.current.set(n, handler);
            pageRefs.current.set(n, el);
            observer?.observe(el);
         }
      },
      [handlePageClick]
   );

   // Reserve a little horizontal padding inside the scroll container so the
   // page doesn't touch the scrollbar edge.
   const pageWidth =
      containerWidth > 0 ? Math.max(containerWidth - 24, 0) : undefined;

   if (!cid || filename.split(".").pop() !== "pdf") {
      return <div />;
   }

   return (
      <div
         ref={containerRef}
         className="group relative w-full max-w-4xl max-h-[calc(100vh-16rem)] overflow-y-auto"
      >
         {/* Floating page indicator: always visible briefly after a page
             change, otherwise revealed on hover. */}
         {numPages ? (
            <div
               className={`pointer-events-none sticky top-3 z-20 mx-auto w-fit rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-md backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 ${
                  indicatorPulse ? "opacity-100" : "opacity-0"
               }`}
            >
               {pageNumber} / {numPages}
            </div>
         ) : null}

         <Document
            file={`${DOCUMENTS_ENDPOINT}/version/${cid}`}
            onLoadSuccess={onDocumentLoadSuccess}
            options={DOCUMENT_OPTIONS}
         >
            {numPages
               ? Array.from({ length: numPages }, (_, i) => {
                    const n = i + 1;
                    const isActivePage = pageNumber === n;
                    return (
                       <div
                          key={n}
                          ref={setPageRef(n)}
                          className="relative mx-auto mb-4 w-fit cursor-crosshair"
                       >
                          <Page pageNumber={n} width={pageWidth} />

                          {isActivePage && newNoteVisible && (
                             <div
                                className="absolute z-50 text-red-500"
                                style={{
                                   left: `${newNotePosition?.x}%`,
                                   top: `${newNotePosition?.y}%`
                                }}
                             >
                                <StickyNote />
                             </div>
                          )}

                          {isActivePage && noteVisible && (
                             <div
                                className="absolute z-[100] text-blue-500"
                                style={{
                                   left: `${notePosition?.x}%`,
                                   top: `${notePosition?.y}%`
                                }}
                             >
                                <StickyNote />
                             </div>
                          )}
                       </div>
                    );
                 })
               : null}
         </Document>
      </div>
   );
}

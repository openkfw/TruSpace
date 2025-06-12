"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { useTranslations } from "next-intl";

import { ChevronLeft, ChevronRight, StickyNote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DOCUMENTS_ENDPOINT } from "@/lib/services";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   "pdfjs-dist/build/pdf.worker.min.mjs",
   import.meta.url
).toString();

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
   setNoteVisible,
   notePosition,
   setNotePosition
}) {
   const [numPages, setNumPages] = useState<number>();
   const translations = useTranslations("documentPreview");

   const previewContainer = useRef(null);

   function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
      setNumPages(numPages);
   }

   function nextPage(): void {
      // check if next page is available
      if (pageNumber >= numPages) {
         return;
      }
      setPageNumber((prevPageNumber) => prevPageNumber + 1);
      setNewNoteVisible(false);
      setNoteVisible(false);
      setNotePosition(null);
   }

   function previousPage(): void {
      // check if we are not ar first page
      if (pageNumber <= 1) {
         return;
      }
      setPageNumber((prevPageNumber) => prevPageNumber - 1);
      setNewNoteVisible(false);
      setNoteVisible(false);
      setNotePosition(null);
   }

   // detect click in document canvas with class "react-pdf__Page" with coordinates
   // and use them to determine the position of the annotation
   const handleClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
         const documentPages = previewContainer.current?.pages?.current;
         const documentPage = documentPages?.[Object.keys(documentPages)[0]];
         const canvas = documentPage?.querySelector("canvas");
         if (!canvas) {
            return;
         }
         // get document page div width and height
         const documentPageWidth = documentPage.clientWidth;
         const documentPageHeight = documentPage.clientHeight;

         // get click x and y coordinates relative to the canvas
         let x = e.clientX - documentPage.getBoundingClientRect().left;
         let y = e.clientY - documentPage.getBoundingClientRect().top;

         const iconWidth = 20;
         const iconHeight = 20;

         // center the note position based on icon size
         if (x > iconWidth) {
            x -= iconWidth / 2;
         }
         if (y > iconHeight) {
            y -= iconHeight / 2;
         }

         // calculate percentage of the click position relative to the canvas size
         const xPerc = ((x / documentPageWidth) * 100).toFixed(6);
         const yPerc = ((y / documentPageHeight) * 100).toFixed(6);

         // add point above canvas
         setNewNotePosition({ x: xPerc, y: yPerc });
         setNewNoteVisible(true);
      },
      [setNewNotePosition, setNewNoteVisible]
   );

   // add event listener to canvas after the document is loaded
   // to detect clicks
   const addCanvasClickListener = useCallback(() => {
      const documentPage =
         previewContainer.current?.pages?.current?.[pageNumber - 1];
      if (documentPage) {
         documentPage.addEventListener("click", handleClick);
      }
   }, [pageNumber, handleClick]);

   useEffect(() => {
      addCanvasClickListener();
      return () => {
         const documentPage =
            previewContainer.current?.pages?.current?.[pageNumber - 1];
         if (documentPage) {
            documentPage.removeEventListener("click", handleClick);
         }
      };
   }, [numPages, pageNumber, addCanvasClickListener, handleClick]);

   const documentOptions = useMemo(
      () => ({
         withCredentials: true
      }),
      []
   );

   // check if name is a pdf file
   if (!cid || filename.split(".").pop() === "pdf") {
      return (
         <div>
            <div className="flex justify-center items-center gap-4 mb-2">
               <Button
                  className="h-8 w-8"
                  variant="outline"
                  size="icon"
                  onClick={previousPage}
               >
                  <ChevronLeft />
               </Button>
               <span className="text-sm font-medium">
                  {translations("page")} {pageNumber} {translations("of")}{" "}
                  {numPages}
               </span>
               <Button
                  className="h-8 w-8"
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
               >
                  <ChevronRight />
               </Button>
            </div>
            <Document
               ref={previewContainer}
               file={`${DOCUMENTS_ENDPOINT}/version/${cid}`}
               onLoadSuccess={onDocumentLoadSuccess}
               options={documentOptions}
            >
               <Page pageNumber={pageNumber} className="relative">
                  <div
                     className={`absolute ${newNoteVisible ? "block" : "hidden"} text-red-500 z-50`}
                     style={{
                        left: `${newNotePosition?.x}%`,
                        top: `${newNotePosition?.y}%`
                     }}
                  >
                     <StickyNote />
                  </div>

                  <div
                     className={`absolute text-blue-500 z-[100] ${noteVisible ? "block" : "hidden"}`}
                     style={{
                        left: `${notePosition?.x}%`,
                        top: `${notePosition?.y}%`
                     }}
                  >
                     <StickyNote />
                  </div>
               </Page>
            </Document>
         </div>
      );
   }

   return <div />;
}

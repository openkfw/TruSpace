"use client";

import type * as PdfJsModule from "pdfjs-dist";

let pdfjsPromise: Promise<typeof PdfJsModule> | null = null;

/**
 * Lazily loads pdfjs-dist and configures its worker on first use.
 *
 * pdfjs-dist (v5+) touches browser-only APIs (e.g. DOMMatrix) as soon as its
 * module code runs. A static top-level `import ... from "pdfjs-dist"` can
 * therefore crash if that import is ever evaluated outside a real browser
 * context — which happens in this project because barrel `index.ts`
 * re-exports make client components reachable from Next/Turbopack's
 * server-side module graph regardless of their own "use client" directive.
 *
 * Loading pdfjs-dist dynamically, only at the point of actual use (inside
 * an event handler/effect that only ever runs in the browser), sidesteps
 * this entirely instead of relying on wrapping every consumer in
 * `next/dynamic({ ssr: false })`.
 */
export async function loadPdfjs(): Promise<typeof PdfJsModule> {
   if (!pdfjsPromise) {
      pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
         pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
         ).toString();
         return pdfjs;
      });
   }
   return pdfjsPromise;
}

"use client";
import { PdfJs, TextItem } from "@/interfaces";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

export const isPdfBlank = async (
   file: File,
   pdfjs: PdfJs
): Promise<boolean> => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
         const arrayBuffer = reader.result as ArrayBuffer;

         try {
            const pdfDocument = await pdfjs.getDocument(arrayBuffer).promise;
            let textContent = "";

            for (let i = 1; i <= pdfDocument.numPages; i++) {
               const page = await pdfDocument.getPage(i);
               const text = await page.getTextContent();

               const textItems = text.items.filter(
                  (item): item is TextItem =>
                     typeof (item as any).str === "string"
               );

               const pageText = textItems.map((item) => item.str).join(" ");
               textContent += pageText + " ";
            }

            textContent = textContent.trim();

            resolve(!textContent);
         } catch (error) {
            console.error("Error parsing PDF:", error);
            resolve(true);
         }
      };

      reader.onerror = () => {
         reject(new Error("Failed to read the PDF file."));
      };

      reader.readAsArrayBuffer(file);
   });
};

export const isTouchDevice = (() => {
   let result: boolean | null = null;
   return () => {
      if (result !== null) return result;
      result =
         typeof window !== "undefined" &&
         ("ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia("(pointer: coarse)").matches);
      return result;
   };
})();

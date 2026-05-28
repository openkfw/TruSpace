"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { instance as VizInstance } from "@viz-js/viz";
import { Loader2, RefreshCw, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger
} from "@/components/ui/dialog";
import { useNetworkGraph } from "@/lib/services";

export default function NetworkTopologyDialog() {
   const t = useTranslations("appStatus");
   const [open, setOpen] = useState(false);
   const [svgContent, setSvgContent] = useState<string | null>(null);
   const [renderError, setRenderError] = useState<string | null>(null);
   const containerRef = useRef<HTMLDivElement>(null);

   const { graph, isLoading, error, mutate } = useNetworkGraph(open);

   useEffect(() => {
      if (!graph) {
         setSvgContent(null);
         setRenderError(null);
         return;
      }

      VizInstance().then((viz) => {
         try {
            const svg = viz.renderSVGElement(graph);
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.removeAttribute("style");
            setSvgContent(svg.outerHTML);
            setRenderError(null);
         } catch (e) {
            console.error("Viz render error:", e);
            console.error("DOT source:", graph);
            setRenderError(e instanceof Error ? e.message : String(e));
         }
      }).catch((e) => {
         console.error("Viz instance error:", e);
         setRenderError(e instanceof Error ? e.message : String(e));
      });
   }, [graph]);

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
               <Share2 className="w-4 h-4" />
               {t("networkTopology")}
            </Button>
         </DialogTrigger>
         <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col">
            <DialogHeader>
               <div className="flex items-center justify-between pr-6">
                  <DialogTitle>{t("networkTopologyTitle")}</DialogTitle>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => mutate()}
                     disabled={isLoading}
                  >
                     <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                     {t("refresh")}
                  </Button>
               </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto min-h-0" ref={containerRef}>
               {isLoading && !svgContent ? (
                  <div className="flex items-center justify-center h-64 gap-2 text-gray-500">
                     <Loader2 className="w-5 h-5 animate-spin" />
                     <span>{t("loadingNetworkTopology")}</span>
                  </div>
               ) : error || renderError ? (
                  <div className="flex flex-col gap-3 p-4">
                     <p className="text-red-500 text-sm font-medium">{t("failedToLoadNetworkTopology")}</p>
                     {(error || renderError) && (
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                           {renderError ?? String(error)}
                        </pre>
                     )}
                     {renderError && graph && (
                        <details className="text-xs">
                           <summary className="cursor-pointer text-gray-500">Raw DOT source</summary>
                           <pre className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap">{graph}</pre>
                        </details>
                     )}
                  </div>
               ) : svgContent ? (
                  <div
                     className="w-full h-full p-4 [&_svg]:w-full [&_svg]:h-auto"
                     dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
               ) : null}
            </div>
         </DialogContent>
      </Dialog>
   );
}

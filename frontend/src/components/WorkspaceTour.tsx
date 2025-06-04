"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useTranslations } from "next-intl";

export default function WorkspaceTour() {
   const [show, setShow] = useState(false);
   const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
   const tourTranslations = useTranslations("tour");

   const updateMenuRect = () => {
      const menu = document.getElementById("workspace-menu-tour-target");
      if (menu) {
         const rect = menu.getBoundingClientRect();
         setMenuRect(rect);
      }
   };

   useEffect(() => {
      const hasSeenTour = localStorage.getItem("seenWorkspaceTour");
      if (!hasSeenTour) {
         updateMenuRect();
         setShow(true);
      }

      window.addEventListener("resize", updateMenuRect);
      window.addEventListener("scroll", updateMenuRect, true);

      return () => {
         window.removeEventListener("resize", updateMenuRect);
         window.removeEventListener("scroll", updateMenuRect, true);
      };
   }, []);

   const handleClose = () => {
      setShow(false);
      localStorage.setItem("seenWorkspaceTour", "true");
   };

   if (!show || !menuRect) return null;

   return (
      <>
         <div className="fixed inset-0 z-40 pointer-events-auto">
            <svg className="w-full h-full">
               <defs>
                  <mask id="workspace-mask">
                     <rect width="100%" height="100%" fill="white" />
                     <rect
                        x={menuRect.left - 8}
                        y={menuRect.top}
                        width={menuRect.width}
                        height={menuRect.height}
                        rx={5}
                        ry={5}
                        fill="black"
                     />
                  </mask>
               </defs>
               <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.6)"
                  mask="url(#workspace-mask)"
               />
            </svg>
         </div>
         <div
            className="fixed z-50 border-2 border-blue-400 rounded-md pointer-events-none"
            style={{
               top: menuRect.top - 4,
               left: menuRect.left - 12,
               width: menuRect.width + 8,
               height: menuRect.height + 8
            }}
         />
         <div
            className="fixed z-50 bg-white dark:bg-muted p-4 rounded-md shadow-md max-w-sm"
            style={{
               top: menuRect.top - 50,
               left: menuRect.left - 400
            }}
         >
            <p className="text-sm text-gray-800 dark:text-white">
               {tourTranslations("workspaceMenuDescription")}
            </p>
            <Button onClick={handleClose} className="mt-2">
               {tourTranslations("confirmButton")}
            </Button>
         </div>
      </>
   );
}

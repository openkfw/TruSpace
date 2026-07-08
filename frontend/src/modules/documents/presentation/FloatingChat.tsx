"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { ChevronDown, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Document } from "@/modules/documents/domain";

import DocumentChat from "./DocumentChat";

interface FloatingChatProps {
   cid: string;
   docId: string;
   workspaceOrigin: string;
   documentVersions: Document[];
   pageNumber: number;
   setPageNumber: (page: number) => void;
   newNoteVisible: boolean;
   setNewNoteVisible: (visible: boolean) => void;
   newNotePosition: { x: number; y: number } | undefined;
   setNewNotePosition: (pos: { x: number; y: number }) => void;
   displayNote: ({ x, y }: { x: number; y: number }) => void;
}

export default function FloatingChat({
   cid,
   docId,
   workspaceOrigin,
   documentVersions,
   pageNumber,
   setPageNumber,
   newNoteVisible,
   setNewNoteVisible,
   newNotePosition,
   setNewNotePosition,
   displayNote
}: FloatingChatProps) {
   const [isOpen, setIsOpen] = useState(false);
   const chatRef = useRef<HTMLDivElement>(null);
   const chatTranslations = useTranslations("chat");

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            chatRef.current &&
            !chatRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };

      const handleEscape = (event: KeyboardEvent) => {
         if (event.key === "Escape") {
            setIsOpen(false);
         }
      };

      if (isOpen) {
         document.addEventListener("mousedown", handleClickOutside);
         document.addEventListener("keydown", handleEscape);
      }

      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
         document.removeEventListener("keydown", handleEscape);
      };
   }, [isOpen]);

   const chatButtonRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!chatButtonRef.current) return;

      const updateOffset = () => {
         const height = chatButtonRef.current?.offsetHeight || 0;
         document.documentElement.style.setProperty(
            "--chat-offset",
            `${height + 30}px`
         );
      };

      updateOffset();
      window.addEventListener("resize", updateOffset);
      return () => window.removeEventListener("resize", updateOffset);
   }, []);

   // On mobile, hide the floating button while the page is being scrolled
   // so it doesn't hover on top of the document content. It reappears
   // shortly after scrolling stops.
   const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false);

   useEffect(() => {
      const mobileQuery = window.matchMedia("(max-width: 768px)");
      let scrollTimeout: ReturnType<typeof setTimeout>;

      const handleScroll = () => {
         if (!mobileQuery.matches) return;
         setIsHiddenOnScroll(true);
         clearTimeout(scrollTimeout);
         scrollTimeout = setTimeout(() => setIsHiddenOnScroll(false), 400);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
         window.removeEventListener("scroll", handleScroll);
         clearTimeout(scrollTimeout);
      };
   }, []);

   return (
      <div ref={chatButtonRef} className="fixed bottom-6 right-6 z-50">
         {!isOpen && (
            <Button
               onClick={() => setIsOpen((prev) => !prev)}
               className={`flex items-center h-16 pr-1 bg-blue-600 hover:bg-blue-700 rounded-full shadow-md group transition-all duration-300 ${
                  isHiddenOnScroll
                     ? "opacity-0 translate-y-4 pointer-events-none"
                     : "opacity-100 translate-y-0"
               }`}
            >
               <span className="text-lg font-bold">
                  {chatTranslations("chat")}
               </span>
               <div className="bg-blue-500 group-hover:bg-blue-600 p-3 rounded-full transition-colors">
                  <MessageCircle className="!size-8 text-white fill-white transition-transform duration-200 group-hover:scale-110" />
               </div>
            </Button>
         )}

         {isOpen && (
            <div
               ref={chatRef}
               className="absolute bottom-14 right-0 w-[calc(100vw-3rem)] max-w-[400px] h-[600px] bg-card rounded-md shadow-md"
            >
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-2 right-2 p-1 rounded-full"
                  aria-label="Close chat"
               >
                  <ChevronDown className="!size-5" />
               </Button>

               <DocumentChat
                  cid={cid}
                  docId={docId}
                  workspaceOrigin={workspaceOrigin}
                  documentVersions={documentVersions}
                  documentPageNumber={pageNumber}
                  setDocumentPageNumber={setPageNumber}
                  newNoteVisible={newNoteVisible}
                  setNewNoteVisible={setNewNoteVisible}
                  newNotePosition={newNotePosition}
                  setNewNotePosition={setNewNotePosition}
                  displayNote={displayNote}
               />
            </div>
         )}
      </div>
   );
}

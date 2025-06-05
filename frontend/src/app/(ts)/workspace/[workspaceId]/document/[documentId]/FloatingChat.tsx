"use client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import DocumentChat from "./DocumentChat";

interface FloatingChatProps {
   cid: string;
   docId: string;
   workspaceOrigin: string;
   documentVersions: any[];
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
   const buttonRef = useRef<HTMLButtonElement>(null);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            chatRef.current &&
            !chatRef.current.contains(event.target as Node) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target as Node)
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

   return (
      <div className="fixed bottom-6 right-6 z-50">
         <Button
            ref={buttonRef}
            size="icon"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-12 w-12 rounded-full shadow-md transition-transform duration-200 hover:scale-110"
         >
            <MessageCircle className="!size-6" />
         </Button>

         {isOpen && (
            <div
               ref={chatRef}
               className="absolute bottom-14 right-0 w-[400px] h-[600px] bg-card rounded-md shadow-md"
            >
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

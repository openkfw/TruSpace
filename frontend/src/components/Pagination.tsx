"use client";

import { useState } from "react";

import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious
} from "@/components/ui/pagination";

type PaginationComponentProps = {
   totalPages: number;
   initialPage?: number;
   onPageChange?: (page: number) => void;
};

export default function PaginationComponent({
   totalPages,
   initialPage = 1,
   onPageChange
}: PaginationComponentProps) {
   const [currentPage, setCurrentPage] = useState(initialPage);

   const handlePageChange = (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      onPageChange?.(page);
   };

   if (!totalPages || totalPages <= 1) return null; // No pagination needed if only one or no page

   return (
      <Pagination>
         <PaginationContent>
            <PaginationItem>
               <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                     e.preventDefault();
                     handlePageChange(currentPage - 1);
                  }}
               />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
               <PaginationItem key={page}>
                  <PaginationLink
                     href="#"
                     isActive={page === currentPage}
                     onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                     }}
                  >
                     {page}
                  </PaginationLink>
               </PaginationItem>
            ))}

            <PaginationItem>
               <PaginationNext
                  href="#"
                  onClick={(e) => {
                     e.preventDefault();
                     handlePageChange(currentPage + 1);
                  }}
               />
            </PaginationItem>
         </PaginationContent>
      </Pagination>
   );
}

"use client";
import { DragEvent, useEffect, useMemo, useState } from "react";
import { defaultStyles, FileIcon } from "react-file-icon";
import { toast } from "react-toastify";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
   flexRender,
   getCoreRowModel,
   useReactTable
} from "@tanstack/react-table";
import {
   CircleUser,
   CircleUserRound,
   Dot,
   Lock,
   MessageSquareText,
   MoreVertical
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";

import EmptyWorkspace from "@/app/(ts)/workspace/EmptyWorkspace";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow
} from "@/components/ui/table";
import { useDocuments } from "@/contexts/DocumentsContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatDateDays } from "@/lib/formatDate";
import {
   deleteDocument,
   DOCUMENTS_ENDPOINT,
   documentUpload
} from "@/lib/services";
import { isPdfBlank } from "@/lib/utils";

import { Badge } from "./ui/badge";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "./ui/tooltip";
import PaginationComponent from "./Pagination";
import DocumentTags from "../app/(ts)/workspace/[workspaceId]/document/[documentId]/DocumentTags";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
   "pdfjs-dist/build/pdf.worker.min.mjs",
   import.meta.url
).toString();

const MAX_FILE_SIZE_MB = 110;

function getFileExtension(filename: string) {
   if (filename.toLowerCase().endsWith(".editablefile")) {
      return "editable";
   }
   return filename.split(".").pop();
}

const DocumentList = ({ workspaceId }) => {
   const router = useRouter();
   const translations = useTranslations("homePage");
   const generalTranslations = useTranslations("general");
   const documentTranslations = useTranslations("document");
   const { count, limit, documents, fetchDocuments } = useDocuments();
   const [from, setFrom] = useState(0);

   const [filteredDocuments, setFilteredDocuments] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [searchQuery, setSearchQuery] = useState("");

   const debouncedSearchQuery = useDebounce(searchQuery, 250);

   const { workspace } = useWorkspaceContext();
   const [isDragging, setIsDragging] = useState(false);

   const columns = useMemo(
      () => [
         {
            accessorKey: "icon",
            header: "",
            cell: ({ row }) => {
               const fileExtension = getFileExtension(
                  row.original.meta.filename
               );
               return (
                  <div className="w-12 mt-4 mb-4">
                     <FileIcon
                        extension={fileExtension}
                        {...defaultStyles[fileExtension]}
                     />
                  </div>
               );
            }
         },
         {
            accessorKey: "name",
            header: translations("documentName"),
            cell: ({ row }) => {
               const fileSize = row.original.meta.size
                  ? Math.round(row.original.meta.size / 10000) / 100 + " MB"
                  : "-";
               const version = row.original.documentVersionsLength;
               const daysAgo = formatDateDays(row.original.meta.timestamp);
               const isEditableFile =
                  row.original.meta.filename.endsWith(".editableFile");
               const fileName = isEditableFile
                  ? row.original.meta.filename.slice(0, -13)
                  : row.original.meta.filename;
               return (
                  <div>
                     <div className="text-lg font-bold mt-3">
                        {fileName}
                        {isEditableFile && (
                           <Badge className="ml-2">
                              {translations("editable")}
                           </Badge>
                        )}
                     </div>
                      <DocumentTags
                          cid={row.original.cid}
                          workspaceOrigin={row.original.workspaceOrigin}
                          docId={row.original.docId}
                          status={row.original.status}
                      />
                     <div className="font-semibold flex flex-inline mb-3">
                        {row.original.meta.creator} <Dot className="-mt-0.5" />{" "}
                        {fileSize} <Dot className="-mt-0.5" />{" "}
                        {version ? (
                           <>
                              v{version} <Dot className="-mt-0.5" />
                           </>
                        ) : (
                           ""
                        )}{" "}
                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger>
                                 {daysAgo === 0
                                    ? generalTranslations("today")
                                    : daysAgo === 1
                                      ? generalTranslations("yesterday")
                                      : `${daysAgo} ${generalTranslations("daysAgo")}`}
                              </TooltipTrigger>
                              <TooltipContent>
                                 {formatDate(row.original.meta.timestamp)}
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     </div>
                  </div>
               );
            }
         },
         {
            accessorKey: "timestamp",
            header: "",
            cell: ({ row }) => {
               const collaboratorsNumber =
                  row.original.uniqueContributorsLength;
               return (
                  <div className="flex">
                     {collaboratorsNumber > 0 && <CircleUserRound />}
                     {collaboratorsNumber > 1 && (
                        <CircleUser className="-ml-1" />
                     )}
                     {collaboratorsNumber > 2 && (
                        <CircleUserRound className="-ml-1" />
                     )}
                     {collaboratorsNumber > 3 && (
                        <span className="text-lg">
                           +{collaboratorsNumber - 3}
                        </span>
                     )}
                  </div>
               );
            }
         },
         {
            accessorKey: "chats",
            header: "",
            cell: ({ row }) => {
               return (
                  <div className="flex">
                     <MessageSquareText className="mt-1" />{" "}
                     <span className="text-lg ml-1">
                        {row.original.chatsLength}
                     </span>
                  </div>
               );
            }
         },
         {
            accessorKey: "actions",
            header: translations("actions"),
            cell: ({ row }) => (
               <div className="flex justify-center items-center">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                           <span className="sr-only">
                              {translations("openMenu")}
                           </span>
                           <MoreVertical className="h-4 w-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                           <Link
                              href={`/workspace/${workspaceId || row.original.meta.workspaceOrigin}/document/${row.original.docId}`}
                           >
                              {translations("detail")}
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={(e: React.MouseEvent<HTMLElement>) =>
                              downloadDocument(e, row.original.cid)
                           }
                        >
                           {translations("download")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={(e: React.MouseEvent<HTMLElement>) =>
                              removeDocument(e, row.original.docId)
                           }
                        >
                           {translations("delete")}
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            )
         }
      ],
      [translations]
   );

   const table = useReactTable({
      data: documents,
      columns,
      getCoreRowModel: getCoreRowModel()
   });

   useEffect(() => {
      const loadDocuments = async () => {
         try {
            await fetchDocuments(
               workspaceId,
               from,
               undefined,
               debouncedSearchQuery
            );
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };
      loadDocuments();
   }, [workspaceId, from, debouncedSearchQuery]);

   useEffect(() => {
      setFilteredDocuments(documents);
   }, [debouncedSearchQuery, documents]);

   const downloadDocument = async (
      event: React.MouseEvent<HTMLElement>,
      cid: string
   ) => {
      event.stopPropagation();
      window.open(`${DOCUMENTS_ENDPOINT}/version/${cid}`);
   };

   const removeDocument = async (
      event: React.MouseEvent<HTMLElement>,
      docId: string
   ) => {
      event.stopPropagation();
      try {
         await deleteDocument(docId, translations("failedToDelete"));
         setTimeout(() => fetchDocuments(workspaceId), 1000);
         toast.success(documentTranslations("documentDeleted"));
      } catch (err) {
         setError(err.message);
         toast.error(documentTranslations("documentDeleteError"));
      }
   };

   const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
   };

   const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
   };

   const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      for (const file of files) {
         if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(
               `${file.name}: ${documentTranslations("documentTooLargeError")}`
            );
            continue;
         }

         const ext = file.name.split(".").pop()?.toLowerCase();
         if (ext === "pdf") {
            try {
               const isBlank = await isPdfBlank(file, pdfjs);
               if (isBlank) {
                  toast.error(
                     `${file.name}: ${documentTranslations("blankPdfError")}`
                  );
                  continue;
               }
            } catch (err) {
               console.error("PDF check failed:", err);
               toast.error(documentTranslations("documentUploadError"));
            }
         }

         const formData = new FormData();
         formData.append("workspace", workspace?.uuid || workspaceId);
         formData.append("file", file, file.name);

         try {
            await documentUpload(
               formData,
               undefined,
               translations("uploadError")
            );
            await fetchDocuments(workspace?.uuid || workspaceId);
            toast.success(documentTranslations("documentUploaded"));
         } catch (err) {
            console.error(err);
            toast.error(documentTranslations("documentUploadError"));
         }
      }
   };

   if (loading) {
      return (
         <p className="text-center text-gray-500">
            {generalTranslations("loading")}
         </p>
      );
   }

   if (error) {
      if (error === "unauthorized") {
         return (
            <div className="items-center mt-2 text-center">
               <Lock className="w-16 h-16 mx-auto mt-10" />
               <h2 className="text-xl font-bold">Workspace is private</h2>
            </div>
         );
      } else {
         return (
            <p className="text-center text-red-500">
               {generalTranslations("error")}: {error}
            </p>
         );
      }
   }

   if (documents.length === 0) {
      return (
         <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 rounded-lg overflow-hidden relative transition-colors ${
               isDragging ? "border-2 border-blue-500" : "border-none"
            }`}
         >
            <EmptyWorkspace />
         </div>
      );
   }

   return (
      <>
         <div className="flex justify-between items-center mt-4">
            <SearchBar
               value={searchQuery}
               onChange={setSearchQuery}
               placeholder={translations("searchPlaceholder")}
            />
         </div>

         <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 rounded-lg overflow-hidden relative transition-colors ${
               isDragging ? "border-2 border-blue-500" : "border-none"
            }`}
         >
            <Table
               className="border-r last-of-type:border-none"
               data-test-id="document-list-table"
            >
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                           <TableHead
                              key={header.id}
                              className="bg-secondary text-slate-800 dark:text-slate-50 border-bottom last-of-type:border-none last-of-type:text-center"
                           >
                              <div>
                                 {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                         header.column.columnDef.header,
                                         header.getContext()
                                      )}
                              </div>
                           </TableHead>
                        ))}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {filteredDocuments.map((document) => (
                     <TableRow
                        key={document.docId}
                        onClick={() =>
                           router.push(
                              `/workspace/${workspaceId || document.meta.workspaceOrigin}/document/${document.docId}`
                           )
                        }
                        className="cursor-pointer hover:bg-border/25 dark:hover:bg-ring/40"
                     >
                        {columns.map((column) => (
                           <TableCell
                              key={column.accessorKey}
                              className="border-bottom last-of-type:border-none"
                           >
                              {column.cell
                                 ? column.cell({ row: { original: document } })
                                 : document[column.accessorKey]}
                           </TableCell>
                        ))}
                     </TableRow>
                  ))}
               </TableBody>
            </Table>

            <PaginationComponent
               totalPages={Math.ceil(count / limit)}
               onPageChange={(page) => setFrom((page - 1) * limit)}
            />
         </div>
      </>
   );
};

export default DocumentList;

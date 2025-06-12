"use client";
import { useEffect, useMemo, useState } from "react";
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

import EmptyWorkspace from "@/app/(ts)/workspace/EmptyWorkspace";
import { formatDate, formatDateDays } from "@/app/helper/formatDate";
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
import { useDebounce } from "@/hooks/useDebounce";
import { deleteDocument, DOCUMENTS_ENDPOINT } from "@/lib/services";

import { Badge } from "./ui/badge";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "./ui/tooltip";

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
   const { documents, fetchDocuments } = useDocuments();

   const [filteredDocuments, setFilteredDocuments] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [searchQuery, setSearchQuery] = useState("");

   const debouncedSearchQuery = useDebounce(searchQuery, 250);

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
                     <div className="text-lg font-bold mb-1 mt-3">
                        {fileName}
                        {isEditableFile && (
                           <Badge className="ml-2">
                              {translations("editable")}
                           </Badge>
                        )}
                     </div>
                     <div className="font-thin">
                        {documentTranslations("summaryOf")}
                     </div>
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
                           onClick={() => downloadDocument(row.original.cid)}
                        >
                           {translations("download")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onClick={() => removeDocument(row.original.docId)}
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
            await fetchDocuments(workspaceId);
         } catch (err) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };
      loadDocuments();
   }, [workspaceId]);

   useEffect(() => {
      if (debouncedSearchQuery) {
         const lowercasedQuery = debouncedSearchQuery.toLowerCase();
         const filtered = documents.filter((doc) =>
            doc.meta.filename.toLowerCase().includes(lowercasedQuery)
         );
         setFilteredDocuments(filtered);
      } else {
         setFilteredDocuments(documents);
      }
   }, [debouncedSearchQuery, documents]);

   const downloadDocument = async (cid: string) => {
      window.open(`${DOCUMENTS_ENDPOINT}/version/${cid}`);
   };

   const removeDocument = async (docId: string) => {
      try {
         await deleteDocument(docId, translations("failedToDelete"));
         setTimeout(() => fetchDocuments(workspaceId), 1000);
         toast.success(documentTranslations("documentDeleted"));
      } catch (err) {
         setError(err.message);
         toast.error(documentTranslations("documentDeleteError"));
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
      return <EmptyWorkspace />;
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

         <div className="mt-6 rounded-lg overflow-hidden border-none">
            <Table className="border-r last-of-type:border-none">
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
         </div>
      </>
   );
};

export default DocumentList;

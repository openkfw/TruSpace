import { formatDate, formatDateDays } from "@/app/helper/formatDate";
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
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import { DOCUMENTS_ENDPOINT } from "@/lib/services";
import {
   flexRender,
   getCoreRowModel,
   useReactTable
} from "@tanstack/react-table";
import { Dot, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "../../../../../../components/ui/button";

export default function DocumentVersions({ documentVersions }) {
   const translations = useTranslations("documentVersion");
   const generalTranslations = useTranslations("general");
   const langTranslations = useTranslations("languages");

   const languageDisplayMap = useMemo(
      () => ({
         English: { flag: "🇬🇧", name: langTranslations("en") },
         German: { flag: "🇩🇪", name: langTranslations("de") },
         French: { flag: "🇫🇷", name: langTranslations("fr") },
         Spanish: { flag: "🇪🇸", name: langTranslations("es") },
         Italian: { flag: "🇮🇹", name: langTranslations("it") },
         Portuguese: { flag: "🇵🇹", name: langTranslations("pt") },
         Russian: { flag: "🇷🇺", name: langTranslations("ru") },
         Chinese: { flag: "🇨🇳", name: langTranslations("zh") }
      }),
      [langTranslations]
   );

   const columns = [
      {
         accessorKey: "index",
         header: translations("version"),
         cell: ({ row }) => (
            <div className="text-base font-bold">
               {row.original?.meta?.version}
            </div>
         )
      },
      {
         accessorKey: "name",
         header: translations("versionName"),
         cell: ({ row }) => {
            const fileSize = row.original?.meta?.size
               ? Math.round(row.original?.meta?.size / 10000) / 100 + " MB"
               : "-";
            const daysAgo = formatDateDays(row.original?.meta?.timestamp);
            const isEditableFile =
               row.original?.meta?.filename.endsWith(".editableFile");
            const fileName = isEditableFile
               ? row.original?.meta?.filename.slice(0, -13)
               : row.original?.meta?.filename;
            return (
               <div>
                  <div className="text-lg font-bold mb-1 mt-3">
                     {fileName}
                     {row.index === 0 && (
                        <span className="ml-2 bg-blue-200 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-sm dark:bg-blue-900 dark:text-blue-300">
                           {translations("newest")}
                        </span>
                     )}
                  </div>
                  <div className="font-semibold flex flex-inline mb-3">
                     {row.original?.meta?.creator} <Dot className="-mt-0.5" />{" "}
                     {fileSize} <Dot className="-mt-0.5" />{" "}
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
                              {formatDate(row.original?.meta?.timestamp)}
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </div>
               </div>
            );
         }
      },
      {
         accessorKey: "language",
         header: translations("language"),
         cell: ({ row }) => {
            let langToSet = "-";
            const metaLanguage = row.original?.meta?.language;

            if (
               typeof metaLanguage === "string" &&
               metaLanguage.trim() !== ""
            ) {
               const trimmedLang = metaLanguage.trim();
               const normalizedMetaLang =
                  trimmedLang.charAt(0).toUpperCase() +
                  trimmedLang.slice(1).toLowerCase();

               if (languageDisplayMap[normalizedMetaLang]) {
                  langToSet = `${languageDisplayMap[normalizedMetaLang].flag} ${languageDisplayMap[normalizedMetaLang].name}`;
               } else {
                  langToSet = normalizedMetaLang;
               }
            }
            return (
               <div className="break-words text-sm max-w-[100px] sm:max-w-52 md:max-w-xs lg:max-w-md xl:max-w-lg">
                  {langToSet}
               </div>
            );
         }
      },
      {
         accessorKey: "cid",
         header: translations("versionCid"),
         cell: ({ row }) => (
            <div className="break-words text-sm max-w-[100px] sm:max-w-52 md:max-w-xs lg:max-w-md xl:max-w-lg">
               {row.original?.cid}
            </div>
         )
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
                     <DropdownMenuItem
                        onClick={() => downloadFile(row.original.cid)}
                     >
                        {translations("download")}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         )
      }
   ];
   const table = useReactTable({
      data: documentVersions,
      columns,
      getCoreRowModel: getCoreRowModel()
   });

   const downloadFile = async (cid: string) => {
      window.open(`${DOCUMENTS_ENDPOINT}/version/${cid}`);
   };

   return (
      <div className="mt-4 rounded-lg overflow-hidden border-none">
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
               {table.getRowModel().rows.map((row) => (
                  <TableRow
                     key={row.id}
                     className="cursor-pointer hover:bg-border/25 dark:hover:bg-ring/40"
                  >
                     {row.getVisibleCells().map((cell) => (
                        <TableCell
                           key={cell.id}
                           className="border-bottom last-of-type:border-none"
                        >
                           {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                           )}
                        </TableCell>
                     ))}
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
   );
}

import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuPortal,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";
import {
   ArrowLeftFromLine,
   ArrowRightFromLine,
   ChevronDown,
   Columns4,
   Paintbrush,
   PanelLeft,
   PanelTop,
   Rows4,
   SquareDashed,
   Table,
   TableCellsMerge,
   TableCellsSplit,
   Trash2
} from "lucide-react";
import { useTranslations } from "next-intl";
import AddColumnAfter from "../icons/AddColumnAfter";
import AddColumnBefore from "../icons/AddColumnBefore";
import AddRowAfter from "../icons/AddRowAfter";
import AddRowBefore from "../icons/AddRowBefore";
import DeleteColumn from "../icons/DeleteColumn";
import DeleteRow from "../icons/DeleteRow";

export default function TableDropdownButton({ editor }) {
   const translations = useTranslations("editor");
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" type="button">
                        <Table />
                        <ChevronDown />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                     <DropdownMenuLabel>
                        {translations("tableEditing")}
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuGroup>
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger>
                              <Table /> {translations("table")}
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                 <div className="grid grid-cols-5 gap-x-2 gap-y-2 p-2">
                                    {Array.from({ length: 25 }).map(
                                       (_, index) => (
                                          <div
                                             key={index}
                                             className="w-6 h-6 border border-gray-300 hover:bg-blue-300 cursor-pointer"
                                             onMouseEnter={(e) => {
                                                const cells =
                                                   e.currentTarget.parentElement
                                                      ?.children;
                                                if (cells) {
                                                   const hoveredRow =
                                                      Math.floor(index / 5);
                                                   const hoveredCol = index % 5;
                                                   Array.from(cells).forEach(
                                                      (cell, i) => {
                                                         const row = Math.floor(
                                                            i / 5
                                                         );
                                                         const col = i % 5;
                                                         cell.classList.toggle(
                                                            "bg-blue-300",
                                                            row <= hoveredRow &&
                                                               col <= hoveredCol
                                                         );
                                                      }
                                                   );
                                                }
                                             }}
                                             onMouseLeave={(e) => {
                                                const cells =
                                                   e.currentTarget.parentElement
                                                      ?.children;
                                                if (cells) {
                                                   Array.from(cells).forEach(
                                                      (cell) => {
                                                         cell.classList.remove(
                                                            "bg-blue-300"
                                                         );
                                                      }
                                                   );
                                                }
                                             }}
                                             onClick={() => {
                                                const rows =
                                                   Math.floor(index / 5) + 1;
                                                const cols = (index % 5) + 1;
                                                const tableHtml =
                                                   `<table><tbody>` +
                                                   Array.from({ length: rows })
                                                      .map(
                                                         () =>
                                                            `<tr>${Array.from({
                                                               length: cols
                                                            })
                                                               .map(
                                                                  () =>
                                                                     `<td>&nbsp;</td>`
                                                               )
                                                               .join("")}</tr>`
                                                      )
                                                      .join("") +
                                                   `</tbody></table>`;
                                                editor.commands.insertContent(
                                                   tableHtml
                                                );
                                             }}
                                          ></div>
                                       )
                                    )}
                                 </div>
                              </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger
                              className={
                                 !editor.isActive("table") ? "opacity-50" : ""
                              }
                           >
                              <SquareDashed /> {translations("cell")}
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .mergeCells()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor.chain().focus().mergeCells().run()
                                    }
                                 >
                                    <TableCellsMerge />{" "}
                                    {translations("mergeCells")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .splitCell()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor.chain().focus().splitCell().run()
                                    }
                                 >
                                    <TableCellsSplit />{" "}
                                    {translations("splitCell")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .goToNextCell()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .goToNextCell()
                                          .run()
                                    }
                                 >
                                    <ArrowRightFromLine />{" "}
                                    {translations("goToNextCell")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .goToPreviousCell()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .goToPreviousCell()
                                          .run()
                                    }
                                 >
                                    <ArrowLeftFromLine />
                                    {translations("goToPreviousCell")}
                                 </DropdownMenuItem>
                              </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger
                              className={
                                 !editor.isActive("table") ? "opacity-50" : ""
                              }
                           >
                              <Rows4 /> {translations("row")}
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .addRowBefore()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .addRowBefore()
                                          .run()
                                    }
                                 >
                                    <AddRowBefore />{" "}
                                    {translations("addRowBefore")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .addRowAfter()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .addRowAfter()
                                          .run()
                                    }
                                 >
                                    <AddRowAfter />{" "}
                                    {translations("addRowAfter")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .toggleHeaderRow()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .toggleHeaderRow()
                                          .run()
                                    }
                                 >
                                    <PanelTop />{" "}
                                    {translations("toggleHeaderRow")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .deleteRow()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor.chain().focus().deleteRow().run()
                                    }
                                 >
                                    <DeleteRow /> {translations("deleteRow")}
                                 </DropdownMenuItem>
                              </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger
                              className={
                                 !editor.isActive("table") ? "opacity-50" : ""
                              }
                           >
                              <Columns4 /> {translations("column")}
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .addColumnBefore()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .addColumnBefore()
                                          .run()
                                    }
                                 >
                                    <AddColumnBefore />{" "}
                                    {translations("addColumnBefore")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .addColumnAfter()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .addColumnAfter()
                                          .run()
                                    }
                                 >
                                    <AddColumnAfter />{" "}
                                    {translations("addColumnAfter")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .toggleHeaderColumn()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .toggleHeaderColumn()
                                          .run()
                                    }
                                 >
                                    <PanelLeft />{" "}
                                    {translations("toggleHeaderColumn")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    disabled={
                                       !editor
                                          .can()
                                          .chain()
                                          .focus()
                                          .deleteColumn()
                                          .run()
                                    }
                                    onClick={() =>
                                       editor
                                          .chain()
                                          .focus()
                                          .deleteColumn()
                                          .run()
                                    }
                                 >
                                    <DeleteColumn />{" "}
                                    {translations("deleteColumn")}
                                 </DropdownMenuItem>
                              </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem
                           disabled={
                              !editor.can().chain().focus().fixTables().run()
                           }
                           onClick={() =>
                              editor.chain().focus().fixTables().run()
                           }
                        >
                           <Paintbrush /> {translations("fixTables")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           disabled={
                              !editor.can().chain().focus().deleteTable().run()
                           }
                           onClick={() =>
                              editor.chain().focus().deleteTable().run()
                           }
                        >
                           <Trash2 /> {translations("deleteTable")}
                        </DropdownMenuItem>
                     </DropdownMenuGroup>
                  </DropdownMenuContent>
               </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>{translations("table")}</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}

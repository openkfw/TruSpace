import {
   ArrowLeftFromLine,
   ArrowRightFromLine,
   Paintbrush,
   PanelLeft,
   PanelTop,
   Square,
   TableCellsMerge,
   TableCellsSplit
} from "lucide-react";

import { Button } from "../ui/button";

import AddColumnAfter from "./icons/AddColumnAfter";
import AddColumnBefore from "./icons/AddColumnBefore";
import AddRowAfter from "./icons/AddRowAfter";
import AddRowBefore from "./icons/AddRowBefore";
import DeleteColumn from "./icons/DeleteColumn";
import DeleteRow from "./icons/DeleteRow";
import TableDelete from "./icons/TableDelete";
import ButtonGroup from "./menu/ButtonGroup";
import { BubbleMenu } from "./plugins/bubble-menu-plugin/BubbleMenu";

export default function TableBubbleMenu({ editor }) {
   if (!editor) return null;

   return (
      <BubbleMenu
         editor={editor}
         tippyOptions={{ duration: 100 }}
         pluginKey={"tableMenu"}
         shouldShow={({ editor, trigger }) => {
            // only show the bubble menu for tables
            return (
               (editor.can().chain().focus().mergeCells().run() ||
                  trigger === "contextmenu") &&
               editor.isActive("table")
            );
         }}
         contextMenuElement={editor?.view.dom}
      >
         <div className="bubble-menu table-bubble-menu flex items-center flex-wrap max-w-xs bg-gray-100 dark:bg-gray-900">
            <ButtonGroup>
               {editor.can().chain().focus().mergeCells().run() &&
                  editor.isActive("table") && (
                     <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                           editor.chain().focus().mergeCells().run()
                        }
                        title="Merge cells"
                        className="bg-gray-300 dark:bg-gray-700"
                     >
                        <TableCellsMerge />
                     </Button>
                  )}
               {editor.can().chain().focus().splitCell().run() &&
                  editor.isActive("table") && (
                     <Button
                        variant="outline"
                        type="button"
                        onClick={() => editor.chain().focus().splitCell().run()}
                        title="Split cell"
                        className="bg-gray-300 dark:bg-gray-700"
                     >
                        <TableCellsSplit />
                     </Button>
                  )}
            </ButtonGroup>
            <ButtonGroup>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  title="Add column before"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <AddColumnBefore />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  title="Add column after"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <AddColumnAfter />
               </Button>
            </ButtonGroup>
            <ButtonGroup>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  title="Add row before"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <AddRowBefore />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  title="Add row after"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <AddRowAfter />
               </Button>
            </ButtonGroup>
            <ButtonGroup>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  title="Delete row"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <DeleteRow />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  title="Delete column"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <DeleteColumn />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  title="Delete table"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <TableDelete />
               </Button>
            </ButtonGroup>

            <ButtonGroup>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                     editor.chain().focus().toggleHeaderColumn().run()
                  }
                  title="Toggle header column"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <PanelLeft />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  title="Toggle header row"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <PanelTop />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                     editor.chain().focus().toggleHeaderCell().run()
                  }
                  title="Toggle header cell"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <Square />
               </Button>
            </ButtonGroup>
            <ButtonGroup>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().mergeOrSplit().run()}
                  title="Merge or split"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <TableCellsMerge />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().fixTables().run()}
                  title="Fix tables"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <Paintbrush />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => editor.chain().focus().goToNextCell().run()}
                  title="Go to next cell"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <ArrowRightFromLine />
               </Button>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                     editor.chain().focus().goToPreviousCell().run()
                  }
                  title="Go to previous cell"
                  className="bg-gray-300 dark:bg-gray-700"
               >
                  <ArrowLeftFromLine />
               </Button>
            </ButtonGroup>
         </div>
      </BubbleMenu>
   );
}

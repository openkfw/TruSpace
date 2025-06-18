/* eslint-disable jsx-a11y/alt-text */

import { useTranslations } from "next-intl";

import {
   AlignCenter,
   AlignLeft,
   AlignRight,
   BoldIcon,
   Code,
   Eraser,
   Image,
   ItalicIcon,
   List,
   ListOrdered,
   Minus,
   Redo,
   RemoveFormatting,
   SquareCode,
   Strikethrough,
   TextQuote,
   Underline,
   Undo,
   WrapText
} from "lucide-react";

import BackgroundColorButton from "./menu/BackgroundColorButton";
import ButtonGroup from "./menu/ButtonGroup";
import DropDownButton from "./menu/DropDownButton";
import FontSizeButton from "./menu/FontSizeButton";
import MenuButton from "./menu/MenuButton";
import TableDropdownButton from "./menu/TableDropdownButton";
import TextColorButton from "./menu/TextColorButton";
import TextType from "./menu/TextType";
import { AllowedButtons } from "./Editor";

interface MenuBarProps {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   editor: any;
   displayInfo: (message: string) => void;
   stickyToolbarTopMargin?: string;
   allowedButtons?: AllowedButtons;
}

export const MenuBar = ({
   editor,
   displayInfo,
   stickyToolbarTopMargin,
   allowedButtons
}: MenuBarProps) => {
   const translations = useTranslations("editor");
   if (!editor) {
      return null;
   }

   const topMargin = stickyToolbarTopMargin
      ? `top-${stickyToolbarTopMargin}`
      : "top-0";

   return (
      <div
         className={`control-group sticky ${topMargin} z-10 bg-gray-100 dark:bg-gray-900 pt-4 pb-4`}
      >
         <div className="mb-1 [&>button]:m-0.5 [&>button]:px-2 flex items-center flex-wrap">
            <ButtonGroup>
               {allowedButtons.bold && (
                  <MenuButton
                     label={translations("bold")}
                     icon={<BoldIcon />}
                     onClick={() => editor.chain().focus().toggleBold().run()}
                     disabled={!editor.can().chain().focus().toggleBold().run()}
                     isActive={editor.isActive("bold")}
                  />
               )}
               {allowedButtons.italic && (
                  <MenuButton
                     label={translations("italic")}
                     icon={<ItalicIcon />}
                     onClick={() => editor.chain().focus().toggleItalic().run()}
                     disabled={
                        !editor.can().chain().focus().toggleItalic().run()
                     }
                     isActive={editor.isActive("italic")}
                  />
               )}
               {allowedButtons.strike && (
                  <MenuButton
                     label={translations("strike")}
                     icon={<Strikethrough />}
                     onClick={() => editor.chain().focus().toggleStrike().run()}
                     disabled={
                        !editor.can().chain().focus().toggleStrike().run()
                     }
                     isActive={editor.isActive("strike")}
                  />
               )}
               {allowedButtons.underline && (
                  <MenuButton
                     label={translations("underline")}
                     icon={<Underline />}
                     onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                     }
                     disabled={
                        !editor.can().chain().focus().toggleUnderline().run()
                     }
                     isActive={editor.isActive("underline")}
                  />
               )}
            </ButtonGroup>

            {allowedButtons.headings && <TextType editor={editor} />}

            {allowedButtons.fontSize && <FontSizeButton editor={editor} />}

            <ButtonGroup>
               {allowedButtons.textAlign && (
                  <MenuButton
                     label={translations("textAlignLeft")}
                     icon={<AlignLeft />}
                     onClick={() =>
                        editor.chain().focus().setTextAlign("left").run()
                     }
                     disabled={
                        !editor.can().chain().focus().setTextAlign("left").run()
                     }
                     isActive={editor.isActive({ textAlign: "left" })}
                  />
               )}
               {allowedButtons.textAlign && (
                  <MenuButton
                     label={translations("textAlignCenter")}
                     icon={<AlignCenter />}
                     onClick={() =>
                        editor.chain().focus().setTextAlign("center").run()
                     }
                     disabled={
                        !editor
                           .can()
                           .chain()
                           .focus()
                           .setTextAlign("center")
                           .run()
                     }
                     isActive={editor.isActive({ textAlign: "center" })}
                  />
               )}
               {allowedButtons.textAlign && (
                  <MenuButton
                     label={translations("textAlignRight")}
                     icon={<AlignRight />}
                     onClick={() =>
                        editor.chain().focus().setTextAlign("right").run()
                     }
                     disabled={
                        !editor
                           .can()
                           .chain()
                           .focus()
                           .setTextAlign("right")
                           .run()
                     }
                     isActive={editor.isActive({ textAlign: "right" })}
                  />
               )}
               {allowedButtons.textAlign && (
                  <MenuButton
                     label={translations("textAlignJustify")}
                     icon={<AlignLeft />}
                     onClick={() =>
                        editor.chain().focus().setTextAlign("justify").run()
                     }
                     disabled={
                        !editor
                           .can()
                           .chain()
                           .focus()
                           .setTextAlign("justify")
                           .run()
                     }
                     isActive={editor.isActive({ textAlign: "justify" })}
                  />
               )}
            </ButtonGroup>

            {(allowedButtons.bulletList || allowedButtons.orderedList) && (
               <ButtonGroup>
                  {allowedButtons.bulletList && (
                     <MenuButton
                        label={translations("bulletList")}
                        icon={<List />}
                        onClick={() =>
                           editor.chain().focus().toggleBulletList().run()
                        }
                        disabled={
                           !editor
                              .can()
                              .chain()
                              .focus()
                              .toggleBulletList()
                              .run()
                        }
                        isActive={editor.isActive("bulletList")}
                     />
                  )}
                  {allowedButtons.orderedList && (
                     <MenuButton
                        label={translations("orderedList")}
                        icon={<ListOrdered />}
                        onClick={() =>
                           editor.chain().focus().toggleOrderedList().run()
                        }
                        disabled={
                           !editor
                              .can()
                              .chain()
                              .focus()
                              .toggleOrderedList()
                              .run()
                        }
                        isActive={editor.isActive("orderedList")}
                     />
                  )}
               </ButtonGroup>
            )}

            {allowedButtons.table && (
               <ButtonGroup>
                  <TableDropdownButton editor={editor} />
               </ButtonGroup>
            )}

            {allowedButtons.image && (
               <DropDownButton
                  trigger={<Image />}
                  options={[
                     {
                        key: "paste",
                        icon: <Image />,
                        label: translations("pasteFromClipboard"),
                        onClick: () => {
                           displayInfo(translations("pasteImageFromClipboard"));
                        }
                     }
                  ]}
               />
            )}

            <ButtonGroup>
               {allowedButtons.codeBlock && (
                  <MenuButton
                     label={translations("code")}
                     icon={<Code />}
                     onClick={() => editor.chain().focus().toggleCode().run()}
                     disabled={!editor.can().chain().focus().toggleCode().run()}
                     isActive={editor.isActive("code")}
                  />
               )}
               {allowedButtons.codeBlock && (
                  <MenuButton
                     label={translations("codeBlock")}
                     icon={<SquareCode />}
                     onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                     }
                     disabled={
                        !editor.can().chain().focus().toggleCodeBlock().run()
                     }
                     isActive={editor.isActive("codeBlock")}
                  />
               )}
               {allowedButtons.blockquote && (
                  <MenuButton
                     label={translations("blockquote")}
                     icon={<TextQuote />}
                     onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                     }
                     disabled={
                        !editor.can().chain().focus().toggleBlockquote().run()
                     }
                     isActive={editor.isActive("blockquote")}
                  />
               )}
               {allowedButtons.horisontalRule && (
                  <MenuButton
                     label={translations("horizontalRule")}
                     icon={<Minus />}
                     onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                     }
                     disabled={
                        !editor.can().chain().focus().setHorizontalRule().run()
                     }
                     isActive={editor.isActive("horizontalRule")}
                  />
               )}
               {allowedButtons.horisontalRule && (
                  <MenuButton
                     label={translations("hardBreak")}
                     icon={<WrapText />}
                     onClick={() => editor.chain().focus().setHardBreak().run()}
                     disabled={
                        !editor.can().chain().focus().setHardBreak().run()
                     }
                     isActive={editor.isActive("hardBreak")}
                  />
               )}
            </ButtonGroup>

            {(allowedButtons.color || allowedButtons.backgroundColor) && (
               <ButtonGroup>
                  {allowedButtons.color && <TextColorButton editor={editor} />}
                  {allowedButtons.backgroundColor && (
                     <BackgroundColorButton editor={editor} />
                  )}
               </ButtonGroup>
            )}

            <ButtonGroup>
               {allowedButtons.clearFormatting && (
                  <MenuButton
                     label={translations("removeStyling")}
                     icon={<RemoveFormatting />}
                     onClick={() =>
                        editor.chain().focus().unsetAllMarks().run()
                     }
                     disabled={
                        !editor.can().chain().focus().unsetAllMarks().run()
                     }
                     isActive={editor.isActive("removeFormatting")}
                  />
               )}
               {allowedButtons.clearFormatting && (
                  <MenuButton
                     label={translations("clearFormatting")}
                     icon={<Eraser />}
                     onClick={() => editor.chain().focus().clearNodes().run()}
                     disabled={!editor.can().chain().focus().clearNodes().run()}
                     isActive={editor.isActive("clearFormatting")}
                  />
               )}
               {allowedButtons.history && (
                  <MenuButton
                     label={translations("undo")}
                     icon={<Undo />}
                     onClick={() => editor.chain().focus().undo().run()}
                     disabled={!editor.can().chain().focus().undo().run()}
                  />
               )}
               {allowedButtons.history && (
                  <MenuButton
                     label={translations("redo")}
                     icon={<Redo />}
                     onClick={() => editor.chain().focus().redo().run()}
                     disabled={!editor.can().chain().focus().redo().run()}
                  />
               )}
            </ButtonGroup>
         </div>
      </div>
   );
};

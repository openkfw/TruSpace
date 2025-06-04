"use client";

import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, Editor as EditorType, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ImageResize from "tiptap-extension-resize-image";
import { Button } from "../ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from "../ui/dialog";
import { MenuBar } from "./MenuBar";
import { BackgroundColor } from "./plugins/background-color/background-color-plugin";
import BubbleMenuExtension from "./plugins/bubble-menu-plugin";
import { BubbleMenu } from "./plugins/bubble-menu-plugin/BubbleMenu";
import { FontSize } from "./plugins/font-size/font-size-plugin";
import "./styles.css";

const allowedImageTypes = [
   "image/bmp",
   "image/gif",
   "image/jpeg",
   "image/jpg",
   "image/png",
   "image/tiff",
   "image/webp",
   "image/x-icon"
];

export interface AllowedButtons {
   bold?: boolean;
   italic?: boolean;
   strike?: boolean;
   underline?: boolean;
   headings?: boolean;
   color?: boolean;
   backgroundColor?: boolean;
   fontSize?: boolean;
   textAlign?: boolean;
   bulletList?: boolean;
   orderedList?: boolean;
   codeBlock?: boolean;
   blockquote?: boolean;
   horisontalRule?: boolean;
   clearFormatting?: boolean;
   image?: boolean;
   link?: boolean;
   table?: boolean;
   history?: boolean;
}

const Editor = ({
   content = "",
   onChange = () => {},
   isRequired = false,
   hasError = false,
   errorMessage = "",
   stickyToolbarTopMargin,
   allowedButtons = {
      bold: true,
      italic: true,
      strike: true,
      underline: true,
      headings: true,
      color: true,
      backgroundColor: true,
      fontSize: true,
      textAlign: true,
      bulletList: true,
      orderedList: true,
      codeBlock: true,
      blockquote: true,
      horisontalRule: true,
      clearFormatting: true,
      image: true,
      link: true,
      table: true,
      history: true
   }
}: {
   content?: string;
   onChange?: (editor: EditorType) => void;
   isRequired?: boolean;
   hasError?: boolean;
   errorMessage?: string;
   stickyToolbarTopMargin?: string;
   allowedButtons?: AllowedButtons;
}) => {
   const translations = useTranslations("editor");
   const [infoDialogText, setInfoDialogText] = useState(null);

   const sanitizedContent =
      content === null || content === undefined || content === ""
         ? null
         : Array.isArray(content)
           ? null
           : content;

   const editor = useEditor({
      immediatelyRender: false,
      extensions: [
         StarterKit.configure({
            bulletList: {
               keepMarks: true,
               keepAttributes: false
            },
            orderedList: {
               keepMarks: true,
               keepAttributes: false
            }
         }),
         Color.configure({ types: [TextStyle.name, ListItem.name] }),
         TextStyle.configure({ mergeNestedSpanStyles: true }),
         TextAlign.configure({
            types: ["heading", "paragraph"]
         }),
         FontSize,
         BackgroundColor,
         Highlight,
         Underline,
         // Table
         Table.configure({
            resizable: true
         }),
         TableRow,
         TableHeader,
         TableCell,
         BubbleMenuExtension,
         ImageResize.configure({
            inline: allowedButtons.image === true,
            allowBase64: allowedButtons.image === true
         }),
         Link.configure({
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
            protocols: ["http", "https"],
            isAllowedUri: (url, ctx) => {
               try {
                  // construct URL
                  const parsedUrl = url.includes(":")
                     ? new URL(url)
                     : new URL(`${ctx.defaultProtocol}://${url}`);

                  // use default validation
                  if (!ctx.defaultValidate(parsedUrl.href)) {
                     return false;
                  }

                  // disallowed protocols
                  const disallowedProtocols = ["ftp", "file", "mailto"];
                  const protocol = parsedUrl.protocol.replace(":", "");

                  if (disallowedProtocols.includes(protocol)) {
                     return false;
                  }

                  // only allow protocols specified in ctx.protocols
                  const allowedProtocols = ctx.protocols.map((p) =>
                     typeof p === "string" ? p : p.scheme
                  );

                  if (!allowedProtocols.includes(protocol)) {
                     return false;
                  }

                  // disallowed domains
                  const disallowedDomains = [
                     "example-phishing.com",
                     "malicious-site.net"
                  ];
                  const domain = parsedUrl.hostname;

                  if (disallowedDomains.includes(domain)) {
                     return false;
                  }

                  // all checks have passed
                  return true;
               } catch {
                  return false;
               }
            },
            shouldAutoLink: (url) => {
               try {
                  // construct URL
                  const parsedUrl = url.includes(":")
                     ? new URL(url)
                     : new URL(`https://${url}`);

                  // only auto-link if the domain is not in the disallowed list
                  const disallowedDomains = [
                     "example-no-autolink.com",
                     "another-no-autolink.com"
                  ];
                  const domain = parsedUrl.hostname;

                  return !disallowedDomains.includes(domain);
               } catch {
                  return false;
               }
            }
         })
      ],
      content: sanitizedContent,
      onUpdate({ editor }) {
         onChange(editor);
      },
      editorProps: {
         handlePaste: (_editorView, _clipboardEvent, _slice) => {}
      }
   });

   return (
      <div className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-4 pt-0 mt-2">
         <Dialog
            open={!!infoDialogText}
            onOpenChange={() => setInfoDialogText(null)}
         >
            <DialogContent
               className="sm:max-w-lg"
               onEscapeKeyDown={(e) => e.preventDefault()}
               onInteractOutside={(e) => e.preventDefault()}
            >
               <DialogHeader>
                  <DialogTitle>{translations("info")}</DialogTitle>
               </DialogHeader>
               <DialogDescription />
               <div className="grid gap-4 py-4">
                  <p>{infoDialogText}</p>
               </div>
            </DialogContent>
         </Dialog>
         <MenuBar
            editor={editor}
            displayInfo={setInfoDialogText}
            stickyToolbarTopMargin={stickyToolbarTopMargin}
            allowedButtons={allowedButtons}
         />
         {editor && (
            <BubbleMenu
               editor={editor}
               tippyOptions={{ duration: 100 }}
               pluginKey={"formatMenu"}
               className="format-bubble-menu"
               shouldShow={() => {
                  return false;
               }}
            >
               <div className="bubble-menu">
                  <Button
                     variant="outline"
                     type="button"
                     onClick={() => editor.chain().focus().toggleBold().run()}
                     className={editor.isActive("bold") ? "is-active" : ""}
                  >
                     {translations("bold")}
                  </Button>
                  <Button
                     variant="outline"
                     type="button"
                     onClick={() => editor.chain().focus().toggleItalic().run()}
                     className={editor.isActive("italic") ? "is-active" : ""}
                  >
                     {translations("italic")}
                  </Button>
                  <Button
                     variant="outline"
                     type="button"
                     onClick={() => editor.chain().focus().toggleStrike().run()}
                     className={editor.isActive("strike") ? "is-active" : ""}
                  >
                     {translations("strike")}
                  </Button>
               </div>
            </BubbleMenu>
         )}

         <EditorContent
            editor={editor}
            className="bg-white dark:bg-gray-700 p-4"
         />
         {isRequired && hasError ? (
            <div
               className="flex items-center mt-2 p-4 mb-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800"
               role="alert"
            >
               <CircleAlert className="shrink-0 inline w-4 h-4 me-3" />
               <span className="sr-only">{translations("info")}</span>
               <div>{errorMessage}</div>
            </div>
         ) : null}
      </div>
   );
};

export default Editor;

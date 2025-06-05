"use client";

import {
   Heading1,
   Heading2,
   Heading3,
   Heading4,
   Heading5,
   Heading6,
   Type
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger
} from "../../ui/select";

export default function TextType({ editor }) {
   const translations = useTranslations("editor");

   const onTypeChange = (value: string) => {
      if (value === "paragraph") {
         editor.chain().focus().setParagraph().run();
      }
      if (value === "heading1") {
         editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
      if (value === "heading2") {
         editor.chain().focus().toggleHeading({ level: 2 }).run();
      }
      if (value === "heading3") {
         editor.chain().focus().toggleHeading({ level: 3 }).run();
      }
      if (value === "heading4") {
         editor.chain().focus().toggleHeading({ level: 4 }).run();
      }
      if (value === "heading5") {
         editor.chain().focus().toggleHeading({ level: 5 }).run();
      }
      if (value === "heading6") {
         editor.chain().focus().toggleHeading({ level: 6 }).run();
      }
   };

   const paragraphLabel = (
      <div className="inline-flex items-center">
         <Type className="mr-2" /> {translations("paragraph")}
      </div>
   );
   const heading1Label = (
      <div className="inline-flex items-center">
         <Heading1 className="mr-2" /> {translations("heading1")}
      </div>
   );
   const heading2Label = (
      <div className="inline-flex items-center">
         <Heading2 className="mr-2" /> {translations("heading2")}
      </div>
   );
   const heading3Label = (
      <div className="inline-flex items-center">
         <Heading3 className="mr-2" /> {translations("heading3")}
      </div>
   );
   const heading4Label = (
      <div className="inline-flex items-center">
         <Heading4 className="mr-2" /> {translations("heading4")}
      </div>
   );
   const heading5Label = (
      <div className="inline-flex items-center">
         <Heading5 className="mr-2" /> {translations("heading5")}
      </div>
   );
   const heading6Label = (
      <div className="inline-flex items-center">
         <Heading6 className="mr-2" /> {translations("heading6")}
      </div>
   );

   return (
      <div className="m-0.5 p-0 mr-2 inline-box">
         <Select
            onValueChange={onTypeChange}
            disabled={
               !editor
                  .can()
                  .chain()
                  .focus()
                  .toggleHeading({ level: 1 })
                  .run() && !editor.can().chain().focus().setParagraph().run()
            }
         >
            <SelectTrigger className="w-15 bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-white">
               {editor.isActive("paragraph") && paragraphLabel}
               {editor.isActive("heading", { level: 1 }) && heading1Label}
               {editor.isActive("heading", { level: 2 }) && heading2Label}
               {editor.isActive("heading", { level: 3 }) && heading3Label}
               {editor.isActive("heading", { level: 4 }) && heading4Label}
               {editor.isActive("heading", { level: 5 }) && heading5Label}
               {editor.isActive("heading", { level: 6 }) && heading6Label}
               {!editor.isActive("paragraph") &&
                  !editor.isActive("heading") && (
                     <div className="inline-flex items-center">
                        <Type className="mr-2" /> {translations("otherType")}
                     </div>
                  )}
            </SelectTrigger>
            <SelectContent className="w-15">
               <SelectItem key="paragraph" value="paragraph">
                  {paragraphLabel}
               </SelectItem>

               <SelectItem key="heading1" value="heading1">
                  {heading1Label}
               </SelectItem>

               <SelectItem key="heading2" value="heading2">
                  {heading2Label}
               </SelectItem>

               <SelectItem key="heading3" value="heading3">
                  {heading3Label}
               </SelectItem>

               <SelectItem key="heading4" value="heading4">
                  {heading4Label}
               </SelectItem>

               <SelectItem key="heading5" value="heading5">
                  {heading5Label}
               </SelectItem>

               <SelectItem key="heading6" value="heading6">
                  {heading6Label}
               </SelectItem>
            </SelectContent>
         </Select>
      </div>
   );
}

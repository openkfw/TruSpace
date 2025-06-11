import { useTranslations } from "next-intl";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const defaultFontSize = 16;
const heading1DefaultFontSize = 28;
const heading2DefaultFontSize = 24;
const heading3DefaultFontSize = 20;
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 72, null];

const FontSizeButton = ({ editor }) => {
   const translations = useTranslations("editor");
   // get number from font size, e.g. 16px
   const stripFontSizeFromValue = (value: string) => {
      if (!value) {
         return null;
      }
      return parseInt(value.replace("px", ""), 10);
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
         const size = parseInt(value, 10);
         if (size > 100 || size > 0) {
            editor.commands.setFontSize(size);
         } else {
            editor.commands.unsetFontSize();
         }
      }
   };

   const handleOptionClick = (size: number) => {
      if (size === null) {
         editor.commands.unsetFontSize();
         return;
      }
      if (size > 100 || size < 0) {
         return;
      }
      editor.commands.setFontSize(size);
   };

   const getDefaultFontSize = () => {
      const heading = editor.getAttributes("heading");
      if (heading) {
         if (heading.level === 1) {
            return heading1DefaultFontSize;
         }
         if (heading.level === 2) {
            return heading2DefaultFontSize;
         }
         if (heading.level === 3) {
            return heading3DefaultFontSize;
         }
      }
      return defaultFontSize;
   };

   return (
      <div className="flex items-center">
         <Input
            type="text"
            value={
               stripFontSizeFromValue(
                  editor.getAttributes("textStyle").fontSize
               ) || getDefaultFontSize()
            }
            onChange={handleInputChange}
            className="w-12 rounded-r-none px-2 text-center border-r-0"
         />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button
                  variant="outline"
                  type="button"
                  onClick={() => {}}
                  className="ml-0 px-2 rounded-l-none"
               >
                  <ChevronDown />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
               {fontSizes.map((size) => (
                  <DropdownMenuItem
                     key={size}
                     onClick={() => handleOptionClick(size)}
                  >
                     {size || translations("clearSize")}
                  </DropdownMenuItem>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
};

export default FontSizeButton;

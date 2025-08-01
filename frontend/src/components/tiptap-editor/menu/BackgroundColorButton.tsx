import { useState } from "react";

import { useTranslations } from "next-intl";

import { ChevronDown, PaintBucket } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger
} from "@/components/ui/popover";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";

const colors = [
   [
      "#000000",
      "#FFFFFF",
      "#E0E0E0",
      "#9D9D9D",
      "#616161",
      "#2e2e2e",
      "#111111"
   ], // Gray shades
   [
      "#f44336",
      "#f4cccc",
      "#ea9999",
      "#e06666",
      "#cc0000",
      "#990000",
      "#660000"
   ], // Red shades
   [
      "#744700",
      "#fce5cd",
      "#f9cb9c",
      "#f6b26b",
      "#e69138",
      "#b45f06",
      "#783f04"
   ], // Brown shades
   [
      "#ff9600",
      "#fff2cc",
      "#ffe599",
      "#ffd966",
      "#f1c232",
      "#bf9000",
      "#7f6000"
   ], // Yellow shades
   [
      "#8fce00",
      "#d9ead3",
      "#b6d7a8",
      "#93c47d",
      "#6aa84f",
      "#38761d",
      "#274e13"
   ], // Green shades
   [
      "#2986cc",
      "#d0e0e3",
      "#a2c4c9",
      "#76a5af",
      "#45818e",
      "#134f5c",
      "#0c343d"
   ], // Cyan shades
   [
      "#16537e",
      "#cfe2f3",
      "#9fc5e8",
      "#6fa8dc",
      "#3d85c6",
      "#0b5394",
      "#073763"
   ], // Blue shades
   ["#6a329f", "#d9d2e9", "#b4a7d6", "#8e7cc3", "#674ea7", "#351c75", "#20124d"] // Purple shades
];

export default function BackgroundColorButton({ editor }) {
   const translations = useTranslations("editor");
   const [lastUsedColor, setLastUsedColor] = useState(undefined);
   const handleColorClick = (color: string) => {
      editor.chain().focus().setBackgroundColor(color).run();
      setLastUsedColor(color);
   };

   const handleLastColorClick = () => {
      editor.chain().focus().setBackgroundColor(lastUsedColor).run();
   };

   const handleAutomaticColorClick = () => {
      editor.chain().focus().unsetBackgroundColor().run();
      setLastUsedColor(undefined);
   };

   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <div>
                  <Button
                     variant="outline"
                     type="button"
                     onClick={handleLastColorClick}
                     disabled={
                        !editor.can().chain().focus().setBackgroundColor().run()
                     }
                     className="flex-1 rounded-r-none border-r-0 background-color-white dark:bg-gray-700 color-black dark:text-white"
                     style={{ backgroundColor: lastUsedColor }}
                  >
                     <PaintBucket />
                  </Button>
                  <Popover>
                     <PopoverTrigger asChild>
                        <Button
                           variant="outline"
                           type="button"
                           disabled={
                              !editor
                                 .can()
                                 .chain()
                                 .focus()
                                 .setBackgroundColor()
                                 .run()
                           }
                           className="ml-0 px-2 rounded-l-none"
                        >
                           <ChevronDown />
                        </Button>
                     </PopoverTrigger>
                     <PopoverContent className="p-2">
                        <Button
                           variant="outline"
                           type="button"
                           onClick={handleAutomaticColorClick}
                           className="w-full mb-2"
                        >
                           {translations("noBackgroundColor")}
                        </Button>
                        <div className="grid grid-cols-8 gap-1">
                           {colors[0].map((_color, rowIndex) =>
                              colors.map((_shades, colIndex) => (
                                 <Button
                                    variant="outline"
                                    title={colors[colIndex][rowIndex]}
                                    key={`${colIndex}-${rowIndex}`}
                                    className="border-gray-300 rounded-none"
                                    style={{
                                       backgroundColor:
                                          colors[colIndex][rowIndex]
                                    }}
                                    onClick={() =>
                                       handleColorClick(
                                          colors[colIndex][rowIndex]
                                       )
                                    }
                                 />
                              ))
                           )}
                        </div>
                     </PopoverContent>
                  </Popover>
               </div>
            </TooltipTrigger>

            <TooltipContent>{translations("backgroundColor")}</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}

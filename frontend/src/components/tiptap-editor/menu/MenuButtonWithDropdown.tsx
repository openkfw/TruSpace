import { ChevronDown } from "lucide-react";

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

export default function MenuButtonWithDropdown({
   onClick,
   onDropdownClick,
   dropdownContent,
   disabled,
   isActive,
   label,
   icon
}) {
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <div className="">
                  <Button
                     variant="outline"
                     type="button"
                     onClick={onClick}
                     disabled={disabled}
                     className={`${isActive && "bg-gray-300 dark:bg-gray-700"} flex-1 rounded-r-none border-r-0`}
                  >
                     {icon}
                  </Button>
                  <Popover>
                     <PopoverTrigger asChild>
                        <Button
                           variant="outline"
                           type="button"
                           onClick={onDropdownClick}
                           disabled={disabled}
                           className="ml-0 px-2 rounded-l-none"
                        >
                           <ChevronDown />
                        </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto">
                        {dropdownContent}
                     </PopoverContent>
                  </Popover>
               </div>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}

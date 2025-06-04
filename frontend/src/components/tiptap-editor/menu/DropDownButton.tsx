import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";

interface DropDownButtonProps {
   trigger: ReactNode;
   options: Array<{
      key: string;
      icon: ReactNode;
      label: string;
      onClick: () => void;
   }>;
}

export default function DropDownButton({
   trigger,
   options
}: DropDownButtonProps) {
   return (
      <div className="m-0.5 p-0 mr-2 inline-box">
         <DropdownMenu>
            <DropdownMenuTrigger>
               <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2 false">
                  {trigger} <ChevronDown />
               </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
               {options.map((option) => (
                  <DropdownMenuLabel
                     key={option.key}
                     className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                     onClick={option.onClick}
                  >
                     <div className="inline-flex items-center pointer">
                        <div className="mr-2">{option.icon}</div> {option.label}
                     </div>
                  </DropdownMenuLabel>
               ))}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}

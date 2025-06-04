import { Button } from "@/components/ui/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger
} from "@/components/ui/tooltip";

interface MenuButtonProps {
   onClick: () => void;
   disabled?: boolean;
   isActive?: boolean;
   label: string;
   icon: React.ReactNode;
}
export default function MenuButton({
   onClick,
   disabled = false,
   isActive = false,
   label,
   icon
}: MenuButtonProps) {
   return (
      <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  variant="outline"
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className={`${isActive && "bg-gray-300 dark:bg-gray-700"}`}
               >
                  {icon}
               </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
         </Tooltip>
      </TooltipProvider>
   );
}

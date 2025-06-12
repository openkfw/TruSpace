import { BackendHealth } from "./BackendHealth";
import { LanguageToggle } from "./LanguageToggle";
import { ModeToggle } from "./ModeToggle";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
   return (
      <header className="animate-slide bg-background h-12 p-2 border-b sticky top top-0 z-20">
         <div className="flex h-8 items-center justify-between w-full">
            <div className="flex items-center gap-2 px-4">
               <SidebarTrigger
                  className="-ml-1"
                  data-test-id="sidebar-trigger"
               />
               <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
            <div className="flex items-center">
               <BackendHealth />
               <LanguageToggle />
               <ModeToggle />
            </div>
         </div>
      </header>
   );
}

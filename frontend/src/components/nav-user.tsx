"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Cookies from "js-cookie";
import {
   Bell,
   BrainCircuit,
   ChevronsUpDown,
   LogOut,
   UserRoundCog
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar
} from "@/components/ui/sidebar";
import { useUser } from "@/contexts/UserContext";
import { COOKIE_NAME } from "@/lib";
import { logout } from "@/lib/services";

export function NavUser() {
   const { isMobile } = useSidebar();
   const { user } = useUser();
   const translations = useTranslations("navbar");
   const router = useRouter();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     size="lg"
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                     <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="rounded-lg">
                           {user.initials}
                        </AvatarFallback>
                     </Avatar>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                           {user.name}
                        </span>
                        <span className="truncate text-xs">{user.email}</span>
                     </div>
                     <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
               >
                  <DropdownMenuLabel
                     className="p-0 font-normal"
                     data-test-id="sidebar-user-menu-label"
                  >
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                           <AvatarImage src={user.avatar} alt={user.name} />
                           <AvatarFallback className="rounded-lg">
                              {user.initials}
                           </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-semibold">
                              {user.name}
                           </span>
                           <span className="truncate text-xs">
                              {user.email}
                           </span>
                        </div>
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                     <DropdownMenuItem
                        onClick={() => router.push("/userSettings")}
                     >
                        <UserRoundCog />
                        {translations("userSettings")}
                     </DropdownMenuItem>
                     <DropdownMenuItem>
                        <BrainCircuit />
                        {translations("aiConfig")}
                     </DropdownMenuItem>
                     <DropdownMenuItem>
                        <Bell />
                        {translations("notifications")}
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                     onClick={async () => {
                        try {
                           await logout();
                           Cookies.remove(COOKIE_NAME);
                           router.push("/login");
                        } catch (error) {
                           console.error("Failed to log out:", error);
                        }
                     }}
                     data-test-id="logout-button"
                  >
                     <LogOut />
                     {translations("logOut")}
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

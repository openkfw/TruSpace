"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar
} from "@/components/ui/sidebar";

export function NavDashboard({ activePath }: { activePath: string }) {
   const translations = useTranslations("navbar");
   const router = useRouter();
   const { isMobile, setOpenMobile } = useSidebar();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               tooltip={translations("dashboard")}
               isActive={activePath === "/dashboard"}
            >
               <Button
                  variant="ghost"
                  className="flex justify-start"
                  onClick={() => {
                     router.push("/dashboard");
                     if (isMobile) {
                        setOpenMobile(false);
                     }
                  }}
               >
                  <LayoutDashboard />
                  {translations("dashboard")}
               </Button>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ChartColumn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar
} from "@/components/ui/sidebar";

export function NavStatistics({ activePath }: { activePath: string }) {
   const translations = useTranslations("general");
   const router = useRouter();
   const { isMobile, setOpenMobile } = useSidebar();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               tooltip={translations("statistics")}
               isActive={activePath === "/statistics"}
            >
               <Button
                  variant="ghost"
                  className="flex justify-start"
                  onClick={() => {
                     router.push("/statistics");
                     if (isMobile) {
                        setOpenMobile(false);
                     }
                  }}
               >
                  <ChartColumn />
                  {translations("statistics")}
               </Button>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

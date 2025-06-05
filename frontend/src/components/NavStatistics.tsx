"use client";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem
} from "@/components/ui/sidebar";
import { ChartColumn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function NavStatistics({ activePath }: { activePath: string }) {
   const translations = useTranslations("general");
   const router = useRouter();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               tooltip={translations("statistics")}
               isActive={activePath === "/statistics"}
            >
               <span
                  className="cursor-pointer truncate"
                  onClick={() => router.push("/statistics")}
               >
                  <ChartColumn />
                  {translations("statistics")}
               </span>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

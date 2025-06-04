"use client";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem
} from "@/components/ui/sidebar";
import { LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function NavDashboard({ activePath }: { activePath: string }) {
   const translations = useTranslations("navbar");
   const router = useRouter();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               tooltip={translations("dashboard")}
               isActive={activePath === "/dashboard"}
            >
               <span
                  className="cursor-pointer truncate"
                  onClick={() => router.push("/dashboard")}
               >
                  <LayoutDashboard />
                  {translations("dashboard")}
               </span>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

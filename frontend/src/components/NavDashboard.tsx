"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem
} from "@/components/ui/sidebar";

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
               <Button
                  variant="ghost"
                  className="flex justify-start"
                  onClick={() => router.push("/dashboard")}
               >
                  <LayoutDashboard />
                  {translations("dashboard")}
               </Button>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

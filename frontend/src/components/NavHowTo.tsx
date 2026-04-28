"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { FileQuestionIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar
} from "@/components/ui/sidebar";

export function NavHowTo({ activePath }: { activePath: string }) {
   const translations = useTranslations("general");
   const router = useRouter();
   const { isMobile, setOpenMobile } = useSidebar();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               tooltip={translations("howTo")}
               isActive={activePath === "/howTo"}
            >
               <Button
                  variant="ghost"
                  className="flex justify-start"
                  onClick={() => {
                     router.push("/howTo");
                     if (isMobile) {
                        setOpenMobile(false);
                     }
                  }}
               >
                  <FileQuestionIcon />
                  {translations("howTo")}
               </Button>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

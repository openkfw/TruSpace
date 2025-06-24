"use client";
import { useEffect, useState } from "react";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { NavUser } from "@/components/nav-user";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarHeader,
   SidebarRail,
   useSidebar
} from "@/components/ui/sidebar";
import { useUser } from "@/contexts/UserContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { Workspace } from "@/interfaces";

import { NavDashboard } from "./NavDashboard";
import { NavStatistics } from "./NavStatistics";
import { NavWorkspaces } from "./NavWorkspaces";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const router = useRouter();
   const pathname = usePathname();
   const { setWorkspace, availableWorkspaces } = useWorkspaceContext();

   const [displayedWorkspaces, setDisplayedWorkspaces] =
      useState<Workspace[]>(availableWorkspaces);
   const translations = useTranslations("general");
   const { open } = useSidebar();
   const userContext = useUser();

   useEffect(() => {
      if (availableWorkspaces) {
         setDisplayedWorkspaces(availableWorkspaces);
      }
   }, [availableWorkspaces]);

   const toggleWorkspace = (workspace) => {
      setWorkspace(workspace);
      router.push(`/workspace/${workspace.uuid}`);
   };

   if (!availableWorkspaces || !userContext.user)
      return <div>{translations("loading")}</div>;

   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            {open ? (
               <Image
                  className="cursor-pointer ml-1"
                  src="/images/Logo.svg"
                  onClick={() => router.push("/home")}
                  alt="Logo"
                  width={120}
                  height={80}
                  priority
               />
            ) : (
               <Image
                  className="cursor-pointer truncate"
                  src="/images/LogoRocket.svg"
                  onClick={() => router.push("/home")}
                  alt="Logo Rocket"
                  width={80}
                  height={80}
                  priority
               />
            )}
         </SidebarHeader>
         <SidebarContent>
            <SidebarGroup>
               <NavDashboard activePath={pathname} />
               <NavStatistics activePath={pathname} />
            </SidebarGroup>
            <NavWorkspaces
               activePath={pathname}
               workspaces={displayedWorkspaces}
               setWorkspaces={setDisplayedWorkspaces}
               onSwitch={toggleWorkspace}
            />
         </SidebarContent>
         <SidebarFooter className="mb-2">
            <NavUser />
         </SidebarFooter>
         <SidebarRail />
      </Sidebar>
   );
}

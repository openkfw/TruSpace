"use client";
import {
   ChevronRight,
   Folder,
   Lock,
   LockOpen,
   MoreHorizontal,
   Plus,
   Share2,
   Trash2
} from "lucide-react";
import React, { useState } from "react";

import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuAction,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
   useSidebar
} from "@/components/ui/sidebar";
import { Workspace } from "@/interfaces";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";
import DeleteWorkspaceDialog from "./DeleteWorkspaceDialog";
import WorkspaceDialog from "./WorkspaceDialog";

export function NavWorkspaces({
   onSwitch,
   workspaces,
   activePath,
   setWorkspaces
}: {
   activePath: string;
   onSwitch: (workspace: Workspace) => void;
   workspaces: Workspace[];
   setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
}) {
   const { isMobile } = useSidebar();
   const translations = useTranslations("navbar");
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const router = useRouter();
   const [wCID, setwCID] = useState<string>("");
   const [wUID, setwUID] = useState<string>("");

   const publicWorkspaces = workspaces
      .filter((w) => w.meta.is_public)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
   const privateWorkspaces = workspaces
      .filter((w) => !w.meta.is_public)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));

   return (
      <AuthGuard>
         <SidebarGroup>
            <SidebarGroupLabel>{translations("workspaces")}</SidebarGroupLabel>
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton
                     asChild
                     tooltip={translations("addWorkspace")}
                  >
                     <span
                        className="cursor-pointer truncate"
                        onClick={() => setIsDialogOpen(true)}
                     >
                        <Plus />
                        {translations("addWorkspace")}
                     </span>
                  </SidebarMenuButton>
               </SidebarMenuItem>
               {publicWorkspaces.length > 0 ? (
                  <Collapsible
                     asChild
                     defaultOpen
                     className="group/collapsible"
                  >
                     <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                           <SidebarMenuButton
                              tooltip={translations("publicWorkspaces")}
                           >
                              <LockOpen />
                              <span>{translations("public")}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                           </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                           <SidebarMenuSub>
                              {publicWorkspaces.map((workspace) => (
                                 <SidebarMenuSubItem
                                    key={workspace.uuid}
                                    className="relative cursor-pointer"
                                 >
                                    <SidebarMenuSubButton
                                       asChild
                                       onClick={() => onSwitch(workspace)}
                                       isActive={activePath.startsWith(
                                          `/workspace/${workspace.uuid}`
                                       )}
                                    >
                                       <span className="leading-none pr-6">
                                          {workspace.meta.name ||
                                             workspace.uuid}
                                       </span>
                                    </SidebarMenuSubButton>
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <SidebarMenuAction>
                                             <MoreHorizontal className="mb-1" />
                                             <span className="sr-only">
                                                {translations("more")}
                                             </span>
                                          </SidebarMenuAction>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent
                                          className="w-48 rounded-lg"
                                          side={isMobile ? "bottom" : "right"}
                                          align={isMobile ? "end" : "start"}
                                       >
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() =>
                                                router.push(
                                                   `/workspace/${workspace.uuid}`
                                                )
                                             }
                                          >
                                             <Folder className="text-muted-foreground" />
                                             <span>
                                                {translations("viewWorkspace")}
                                             </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() =>
                                                router.push(
                                                   `/workspace/${workspace.uuid}/share`
                                                )
                                             }
                                          >
                                             <Share2 className="text-muted-foreground" />
                                             <span>
                                                {translations("shareWorkspace")}
                                             </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() => {
                                                setwCID(workspace.cid);
                                                setwUID(workspace.uuid);
                                                requestAnimationFrame(() =>
                                                   setIsDeleteDialogOpen(true)
                                                );
                                             }}
                                          >
                                             <Trash2 className="text-muted-foreground" />
                                             <span>
                                                {translations(
                                                   "deleteWorkspace"
                                                )}
                                             </span>
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </SidebarMenuSubItem>
                              ))}
                           </SidebarMenuSub>
                        </CollapsibleContent>
                     </SidebarMenuItem>
                  </Collapsible>
               ) : null}
               {privateWorkspaces.length > 0 ? (
                  <Collapsible
                     asChild
                     defaultOpen
                     className="group/collapsible"
                  >
                     <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                           <SidebarMenuButton
                              tooltip={translations("privateWorkspaces")}
                           >
                              <Lock />
                              <span>{translations("private")}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                           </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                           <SidebarMenuSub>
                              {privateWorkspaces.map((workspace) => (
                                 <SidebarMenuSubItem
                                    key={workspace.uuid}
                                    className="relative cursor-pointer"
                                 >
                                    <SidebarMenuSubButton
                                       asChild
                                       onClick={() => onSwitch(workspace)}
                                       isActive={activePath.startsWith(
                                          `/workspace/${workspace.uuid}`
                                       )}
                                    >
                                       <span className="leading-none pr-6">
                                          {workspace.meta.name ||
                                             workspace.uuid}
                                       </span>
                                    </SidebarMenuSubButton>
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <SidebarMenuAction>
                                             <MoreHorizontal className="mb-1" />
                                             <span className="sr-only">
                                                {translations("more")}
                                             </span>
                                          </SidebarMenuAction>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent
                                          className="w-48 rounded-lg"
                                          side={isMobile ? "bottom" : "right"}
                                          align={isMobile ? "end" : "start"}
                                       >
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() =>
                                                router.push(
                                                   `/workspace/${workspace.uuid}`
                                                )
                                             }
                                          >
                                             <Folder className="text-muted-foreground" />
                                             <span>
                                                {translations("viewWorkspace")}
                                             </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() =>
                                                router.push(
                                                   `/workspace/${workspace.uuid}/share`
                                                )
                                             }
                                          >
                                             <Share2 className="text-muted-foreground" />
                                             <span>
                                                {translations("shareWorkspace")}
                                             </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() => {
                                                setwCID(workspace.cid);
                                                setwUID(workspace.uuid);
                                                requestAnimationFrame(() =>
                                                   setIsDeleteDialogOpen(true)
                                                );
                                             }}
                                          >
                                             <Trash2 className="text-muted-foreground" />
                                             <span>
                                                {translations(
                                                   "deleteWorkspace"
                                                )}
                                             </span>
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </SidebarMenuSubItem>
                              ))}
                           </SidebarMenuSub>
                        </CollapsibleContent>
                     </SidebarMenuItem>
                  </Collapsible>
               ) : null}
            </SidebarMenu>
            <WorkspaceDialog open={isDialogOpen} setOpen={setIsDialogOpen} />
            <DeleteWorkspaceDialog
               open={isDeleteDialogOpen}
               setOpen={setIsDeleteDialogOpen}
               wCID={wCID}
               wUID={wUID}
               setWorkspaces={setWorkspaces}
            />
         </SidebarGroup>
      </AuthGuard>
   );
}

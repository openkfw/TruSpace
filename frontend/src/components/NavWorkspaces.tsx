"use client";
import React, { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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

import { Button } from "@/components/ui/button";
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
import { useUser } from "@/contexts/UserContext";
import { Workspace } from "@/interfaces";

import DeleteWorkspaceDialog from "./DeleteWorkspaceDialog";
import WorkspaceDialog from "./WorkspaceDialog";
import WorkspaceTypeDialog from "./WorkspaceTypeDialog";

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
   const [isWorkspaceTypeDialogOpen, setIsWorkspaceTypeDialogOpen] =
      useState(false);
   const router = useRouter();
   const [wCID, setwCID] = useState<string>("");
   const [wUID, setwUID] = useState<string>("");
   const { user } = useUser();

   const publicWorkspaces = workspaces
      .filter((w) => w.meta.is_public)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
   const privateWorkspaces = workspaces
      .filter((w) => !w.meta.is_public)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name));

   return (
      <SidebarGroup>
         <SidebarGroupLabel>{translations("workspaces")}</SidebarGroupLabel>
         <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton
                  asChild
                  tooltip={translations("addWorkspace")}
               >
                  <Button
                     variant="ghost"
                     className="flex justify-start"
                     onClick={() => setIsDialogOpen(true)}
                     data-test-id="workspace-create-button"
                  >
                     <Plus />
                     {translations("addWorkspace")}
                  </Button>
               </SidebarMenuButton>
            </SidebarMenuItem>
            {publicWorkspaces.length > 0 ? (
               <Collapsible asChild defaultOpen className="group/collapsible">
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
                                       {workspace.meta.name || workspace.uuid}
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
                                       {workspace.meta?.creator_id ===
                                       user?.uiid ? (
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() => {
                                                setwUID(workspace.uuid);
                                                requestAnimationFrame(() =>
                                                   setIsWorkspaceTypeDialogOpen(
                                                      true
                                                   )
                                                );
                                             }}
                                          >
                                             <Lock className="text-muted-foreground" />
                                             <span>
                                                {translations(
                                                   "switchToPrivate"
                                                )}
                                             </span>
                                          </DropdownMenuItem>
                                       ) : null}

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
                                             {translations("deleteWorkspace")}
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
               <Collapsible asChild defaultOpen className="group/collapsible">
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
                                       {workspace.meta.name || workspace.uuid}
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
                                       {workspace.meta?.creator_id ===
                                       user?.uiid ? (
                                          <DropdownMenuItem
                                             className="cursor-pointer"
                                             onClick={() => {
                                                setwUID(workspace.uuid);
                                                requestAnimationFrame(() =>
                                                   setIsWorkspaceTypeDialogOpen(
                                                      true
                                                   )
                                                );
                                             }}
                                          >
                                             <LockOpen className="text-muted-foreground" />
                                             <span>
                                                {translations("switchToPublic")}
                                             </span>
                                          </DropdownMenuItem>
                                       ) : null}

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
                                             {translations("deleteWorkspace")}
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
         <WorkspaceTypeDialog
            open={isWorkspaceTypeDialogOpen}
            setOpen={setIsWorkspaceTypeDialogOpen}
            wUID={wUID}
         />
      </SidebarGroup>
   );
}

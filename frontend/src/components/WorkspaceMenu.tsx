"use client";
import DocumentCreateDialog from "@/components/DocumentCreateDialog";
import DocumentUpload from "@/components/DocumentUpload";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import DeleteWorkspaceDialog from "./DeleteWorkspaceDialog";
import {
   Menubar,
   MenubarContent,
   MenubarItem,
   MenubarMenu,
   MenubarTrigger
} from "@/components/ui/menubar";
import { Separator } from "./ui/separator";

function WorkspaceMenu() {
   const translations = useTranslations("navbar");
   const homeTranslations = useTranslations("homePage");
   const generalTranslations = useTranslations("general");
   const router = useRouter();
   const { workspace } = useWorkspaceContext();
   const [wCID, setwCID] = useState<string>("");
   const [wUID, setwUID] = useState<string>("");
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   return (
      <>
         <Menubar className="bg-blue-200 dark:bg-muted">
            <MenubarMenu>
               <MenubarTrigger className="hover:bg-blue-500  hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white">
                  {generalTranslations("document")}
               </MenubarTrigger>
               <MenubarContent className="bg-blue-200 dark:bg-muted">
                  <MenubarItem
                     className="hover:bg-blue-500 hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white"
                     onClick={() => setIsCreateDialogOpen(true)}
                  >
                     <span>{homeTranslations("createDocument")}</span>
                  </MenubarItem>
                  <MenubarItem
                     className="hover:bg-blue-500 hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white"
                     onClick={() => setIsDialogOpen(true)}
                  >
                     <span>{homeTranslations("uploadDocumentTitle")}</span>
                  </MenubarItem>
               </MenubarContent>
            </MenubarMenu>
            <Separator orientation="vertical" />
            <MenubarMenu>
               <MenubarTrigger className="hover:bg-blue-500 hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white">
                  {generalTranslations("workspace")}
               </MenubarTrigger>
               <MenubarContent
                  align="end"
                  className="bg-blue-200 dark:bg-muted"
               >
                  <MenubarItem
                     className="hover:bg-blue-500 hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white"
                     onClick={() =>
                        router.push(`/workspace/${workspace.uuid}/share`)
                     }
                  >
                     <span>{translations("shareWorkspace")}</span>
                  </MenubarItem>
                  <MenubarItem
                     className="hover:bg-blue-500 hover:dark:bg-blue-800 focus:bg-blue-500 focus:dark:bg-blue-800 data-[state=open]:bg-blue-500 data-[state=open]:dark:bg-blue-800 hover:text-white focus:text-white data-[state=open]:text-white"
                     onClick={() => {
                        setwCID(workspace.cid);
                        setwUID(workspace.uuid);
                        setIsDeleteDialogOpen(true);
                     }}
                  >
                     <span>{translations("deleteWorkspace")}</span>
                  </MenubarItem>
               </MenubarContent>
            </MenubarMenu>
         </Menubar>
         <DocumentUpload open={isDialogOpen} setOpen={setIsDialogOpen} />
         <DocumentCreateDialog
            open={isCreateDialogOpen}
            setOpen={setIsCreateDialogOpen}
         />
         <DeleteWorkspaceDialog
            open={isDeleteDialogOpen}
            setOpen={setIsDeleteDialogOpen}
            wCID={wCID}
            wUID={wUID}
         />
      </>
   );
}

export default WorkspaceMenu;

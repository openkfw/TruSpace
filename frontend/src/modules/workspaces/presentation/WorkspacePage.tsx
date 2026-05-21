import { DocumentList } from "@/modules/documents";

import WorkspaceMenu from "./WorkspaceMenu";
import WorkspaceTitle from "./WorkspaceTitle";
import WorkspaceTour from "./WorkspaceTour";

export default async function WorkspacePage({
   params
}: {
   params: Promise<{ workspaceId: string }>;
}) {
   const workspaceId = (await params).workspaceId;
   return (
      <div>
         <div className="flex flex-row justify-between items-start mt-2">
            <WorkspaceTitle />
            <div className="space-x-2">
               <div id="workspace-menu-tour-target">
                  <WorkspaceMenu />
               </div>
               <WorkspaceTour />
            </div>
         </div>
         <DocumentList workspaceId={workspaceId} />
      </div>
   );
}

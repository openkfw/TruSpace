import AuthGuard from "@/components/AuthGuard";
import DocumentList from "@/components/DocumentList";
import WorkspaceMenu from "@/components/WorkspaceMenu";
import WorkspaceTitle from "@/components/WorkspaceTitle";
import WorkspaceTour from "@/components/WorkspaceTour";

export default async function WorkspacePage({
   params
}: {
   params: Promise<{ workspaceId: string }>;
}) {
   const workspaceId = (await params).workspaceId;
   return (
      <AuthGuard>
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
      </AuthGuard>
   );
}

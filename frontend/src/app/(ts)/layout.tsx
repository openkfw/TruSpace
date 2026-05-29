import { AppSidebar } from "@/components/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import WorkspaceLoader from "@/modules/workspaces/presentation/WorkspaceLoader";

import App from "./App";

export default function TSLayout({ children }: { children: React.ReactNode }) {
   return (
      <SidebarProvider>
         <WorkspaceLoader />
         <AppSidebar />
         <SidebarInset>
            <App>{children}</App>
         </SidebarInset>
      </SidebarProvider>
   );
}

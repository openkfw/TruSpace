import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default async function TSCleanLayout({
   children
}: {
   children: React.ReactNode;
}) {
   return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

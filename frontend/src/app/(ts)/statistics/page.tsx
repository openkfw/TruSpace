"use client";
import Chart from "@/components/Chart";
import KPIBox from "@/components/KPIBox";
import {
   useDocumentsStatistics,
   usePeers,
   useUsersStatistics
} from "@/lib/services";
import { ChartColumn, ChevronUp, Server, Users } from "lucide-react";

export default function Statistics() {
   const { statistics: documentStatistics } = useDocumentsStatistics();
   const { statistics: userStatistics } = useUsersStatistics();
   const { peers } = usePeers();

   return (
      <div className="pt-4">
         <h1 className="text-3xl font-bold">Statistics</h1>
         <div className="grid grid-cols-3 gap-4 mt-4">
            <KPIBox
               kpi="Total Documents"
               value={documentStatistics?.totalDocuments || "-"}
               valueLabel="documents"
               delta={
                  <>
                     <ChevronUp />
                     {Math.round(
                        (documentStatistics?.recentlyAddedDocuments /
                           documentStatistics?.totalDocuments) *
                           100
                     )}
                     %
                  </>
               }
               deltaColor="green-400"
               icon={<ChartColumn className="w-16 h-16" />}
               iconBgColor="blue-600"
            />
            <KPIBox
               kpi="Collaborators"
               value={userStatistics?.totalUsers || "-"}
               valueLabel="users"
               delta={
                  <>
                     <ChevronUp />
                     {Math.round(
                        (userStatistics?.recentlyAddedUsers /
                           userStatistics?.totalUsers) *
                           100
                     )}
                     %
                  </>
               }
               deltaColor="green-400"
               icon={<Users className="w-16 h-16" />}
               iconBgColor="blue-600"
            />
            <KPIBox
               kpi="Peer servers"
               value={peers?.cluster_peers?.length || "-"}
               deltaColor="red-600"
               icon={<Server className="w-16 h-16" />}
               iconBgColor="blue-600"
            />
         </div>
      </div>
   );
}

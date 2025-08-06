"use client";
import { useTranslations } from "next-intl";

import { ChartColumn, ChevronUp, Server, Users } from "lucide-react";

import KPIBox from "@/components/KPIBox";
import {
   useDocumentsStatistics,
   usePeers,
   useUsersStatistics
} from "@/lib/services";

export default function Statistics() {
   const { statistics: documentStatistics } = useDocumentsStatistics();
   const { statistics: userStatistics } = useUsersStatistics();
   const translations = useTranslations("general");
   const statisticsTranslations = useTranslations("statistics");
   const { peers } = usePeers();

   return (
      <div className="pt-4">
         <h1 className="text-3xl font-bold">{translations("statistics")}</h1>
         <div className="grid grid-cols-3 gap-4 mt-4">
            <KPIBox
               kpi={statisticsTranslations("totalDocuments")}
               value={documentStatistics?.totalDocuments || "-"}
               valueLabel={statisticsTranslations("documents")}
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
               kpi={statisticsTranslations("collaborators")}
               value={userStatistics?.totalUsers || "-"}
               valueLabel={statisticsTranslations("users")}
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
               kpi={statisticsTranslations("peerServers")}
               value={peers?.length || "-"}
               deltaColor="red-600"
               icon={<Server className="w-16 h-16" />}
               iconBgColor="blue-600"
            />
         </div>
      </div>
   );
}

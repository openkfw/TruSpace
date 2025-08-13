"use client";

import { useTranslations } from "next-intl";

import {
   CheckCircle2,
   Globe,
   Info,
   Network,
   RefreshCw,
   Server,
   Users,
   XCircle
} from "lucide-react";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import KPIBox from "@/components/KPIBox";
import { Button } from "@/components/ui/button";
import { useCommitHash } from "@/hooks/useCommitHash";
import { useHealth, usePeers } from "@/lib/services";
interface PeerNode {
   id: string;
   peername?: string;
   addresses?: string[];
   cluster_peers?: string[];
   error?: string;
}

export default function AppStatus() {
   const t = useTranslations();
   const {
      health,
      isLoading: healthLoading,
      mutate: refreshHealth
   } = useHealth();
   const { peers, isLoading: peersLoading, mutate: refreshPeers } = usePeers();
   const handleRefresh = () => {
      refreshHealth();
      refreshPeers();
   };
   const commit = useCommitHash();

   const getStatusIcon = (status: boolean) => {
      return status ? (
         <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : (
         <XCircle className="w-5 h-5 text-red-500" />
      );
   };

   const getStatusColor = (status: boolean) => {
      return status ? "text-green-500" : "text-red-500";
   };

   const connectedNodes = peers?.length || 0;
   const clusterPeers = peers?.length || 0;
   const loading = healthLoading || peersLoading;

   return (
      <div className="pt-4 space-y-6">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t("appStatus.title")}</h1>
            <Button
               onClick={handleRefresh}
               disabled={loading}
               className="disabled:opacity-50"
            >
               <RefreshCw className={`${loading ? "animate-spin" : ""}`} />
               {t("appStatus.refresh")}
            </Button>
         </div>
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <CheckCircle2 className="text-green-500" />
               {t("appStatus.systemHealthOverview")}
            </h2>
            {healthLoading ? (
               <div className="flex items-center justify-center py-8 gap-2">
                  <RefreshCw className="animate-spin text-blue-500" />
                  <span>{t("appStatus.loadingHealthStatus")}</span>
               </div>
            ) : health ? (
               <>
                  <div className="mb-4 p-3 rounded-md bg-gray-100 dark:bg-gray-700">
                     <div className="flex items-center gap-2">
                        {getStatusIcon(Boolean(health.status))}
                        <span
                           className={`font-semibold ${getStatusColor(Boolean(health.status))}`}
                        >
                           {t("appStatus.overallSystemStatus")}{" "}
                           {health.status
                              ? t("appStatus.healthy")
                              : t("appStatus.issuesDetected")}
                        </span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {health.services &&
                        Object.entries(health.services).map(
                           ([service, status]) => (
                              <div
                                 key={service}
                                 className="flex items-center justify-between p-3 border rounded-md"
                              >
                                 <span className="font-medium">{service}</span>
                                 <div className="flex items-center gap-2">
                                    {getStatusIcon(Boolean(status))}
                                    <span
                                       className={getStatusColor(
                                          Boolean(status)
                                       )}
                                    >
                                       {status
                                          ? t("appStatus.online")
                                          : t("appStatus.offline")}
                                    </span>
                                 </div>
                              </div>
                           )
                        )}
                  </div>
               </>
            ) : (
               <div className="text-center py-8 text-gray-500">
                  <XCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                  {t("appStatus.failedToLoadHealthData")}
               </div>
            )}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIBox
               kpi={t("appStatus.truSpaceVersion")}
               value={commit}
               valueLabel=""
               icon={<Info className="w-16 h-16 dark:text-white" />}
            />
            <KPIBox
               kpi={t("appStatus.ipfsNodeId")}
               value={
                  health?.nodeId ? `${health.nodeId.substring(0, 8)}...` : "N/A"
               }
               valueTooltip={health?.nodeId}
               icon={<Globe className="w-16 h-16 dark:text-white" />}
            />
            <KPIBox
               kpi={t("appStatus.connectedNodes")}
               value={connectedNodes.toString()}
               valueLabel={t("appStatus.peers")}
               icon={<Network className="w-16 h-16 dark:text-white" />}
            />
            <KPIBox
               kpi={t("appStatus.clusterPeers")}
               value={clusterPeers.toString()}
               valueLabel={t("appStatus.nodes")}
               icon={<Server className="w-16 h-16 dark:text-white" />}
            />
         </div>
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Globe className="w-6 h-6 text-purple-500" />
               {t("appStatus.ipfsNodeInformation")}
            </h2>

            <div className="space-y-4">
               <div>
                  <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     {t("appStatus.clusterMultiaddress")}
                  </div>
                  <div className="px-2 py-1 mb-2 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm break-all">
                     {health?.clusterMultiaddress ? (
                        <span className="flex items-center gap-2">
                           <span>{health.clusterMultiaddress}</span>
                           <CopyToClipboardButton
                              value={health.clusterMultiaddress}
                           />
                        </span>
                     ) : (
                        t("appStatus.notAvailable")
                     )}
                  </div>
                  <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     {t("appStatus.nodeMultiaddress")}
                  </div>
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm break-all">
                     {health?.nodeMultiaddress ? (
                        <span className="flex items-center gap-2">
                           <span>{health.nodeMultiaddress}</span>
                           <CopyToClipboardButton
                              value={health.nodeMultiaddress}
                           />
                        </span>
                     ) : (
                        t("appStatus.notAvailable")
                     )}
                  </div>
               </div>
               {peers && peers.length > 0 && peers[0].addresses && (
                  <div>
                     <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("appStatus.nodeAddresses")} (
                        {peers[0].addresses.length} {t("appStatus.total")})
                     </div>
                     <div className="space-y-2">
                        {peers[0].addresses
                           .slice(0, 3)
                           .map((address, index) => (
                              <div
                                 key={index}
                                 className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-xs break-all"
                              >
                                 {address}
                              </div>
                           ))}
                        {peers[0].addresses.length > 3 && (
                           <div className="text-sm text-gray-500">
                              {t("appStatus.andMoreAddresses", {
                                 count: peers[0].addresses.length - 3
                              })}
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Users className="text-green-500" />
               {t("appStatus.connectedPeers")} ({connectedNodes})
            </h2>
            {peersLoading ? (
               <div className="flex items-center justify-center py-8 gap-2">
                  <RefreshCw className="animate-spin text-blue-500" />
                  <span>{t("appStatus.loadingPeerInformation")}</span>
               </div>
            ) : peers && peers.length > 0 ? (
               <div className="space-y-3">
                  {peers.slice(0, 5).map((peer: PeerNode, index: number) => (
                     <div
                        key={index}
                        className="px-2 py-1 border rounded-md bg-gray-100 dark:bg-gray-700 transition-colors"
                     >
                        <div className="flex items-center justify-between mb-2">
                           <span className="font-medium">
                              {t("appStatus.peer")} {index + 1}: {peer.peername}
                           </span>
                           {peer.error && peer.error.length > 0 ? (
                              <span className="text-red-500 text-sm flex items-center gap-1">
                                 <XCircle className=" w-4 h-4" />
                                 {t("appStatus.error")}
                              </span>
                           ) : (
                              <span className="text-green-500 text-sm flex items-center gap-1">
                                 <CheckCircle2 className=" w-4 h-4" />
                                 {t("appStatus.connected")}
                              </span>
                           )}
                        </div>
                        <div className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">
                           {peer.id}
                        </div>
                        {peer.cluster_peers &&
                           peer.cluster_peers.length > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                 {t("appStatus.clusterPeersCount", {
                                    count: peer.cluster_peers.length
                                 })}
                              </div>
                           )}
                        {peer.error && peer.error.length > 0 && (
                           <div className="mt-2 text-sm text-red-500">
                              <XCircle className="inline w-4 h-4 mr-1" />
                              {t("appStatus.peerError", {
                                 error: peer.error
                              })}
                           </div>
                        )}
                     </div>
                  ))}
                  {peers.length > 5 && (
                     <div className="text-center text-gray-500 text-sm">
                        {t("appStatus.andMorePeers", {
                           count: peers.length - 5
                        })}
                     </div>
                  )}
               </div>
            ) : (
               <div className="text-center py-8 text-gray-500">
                  <Network className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <div>{t("appStatus.noPeersConnected")}</div>
                  <div className="text-sm text-gray-400 mt-1">
                     {t("appStatus.networkConnectivityIssues")}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}

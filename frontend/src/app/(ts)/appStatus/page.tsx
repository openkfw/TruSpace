"use client";

import { useTranslations } from "next-intl";

import {
   AlertTriangle,
   CheckCircle2,
   Globe,
   Network,
   RefreshCw,
   Users,
   XCircle
} from "lucide-react";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import { Button } from "@/components/ui/button";
import config from "@/config";

import { useHealth, usePeers } from "@/lib/services";
interface PeerNode {
   id: string;
   peername?: string;
   addresses?: string[];
   cluster_peers?: string[];
   error?: string;
}

// Test dataset for cluster adresses to display in UI when developing
const TEST_PEERS_DATASET: PeerNode[] = [
   {
      id: "12D3KooWNEABPmoSCyKVhFKUT1yzvZbnjaNedCLWbfZR65rPmtT7",
      peername: "Test Peer",
      addresses: [
         "/ip4/127.0.0.1/tcp/9096/p2p/12D3KooWNEABPmoSCyKVhFKUT1yzvZbnjaNedCLWbfZR65rPmtT7",
         "/ip4/127.0.0.1/tcp/9097/p2p/12D3KooWNEABPmoSCyKVhFKUT1yzvZbnjaNedCLWbfZR65rPmtT7",
         "/ip4/127.0.0.1/tcp/9098/p2p/12D3KooWNEABPmoSCyKVhFKUT1yzvZbnjaNedCLWbfZR65rPmtT7"
      ]
   }
];

export default function AppStatus() {
   const t = useTranslations();
   const {
      health,
      isLoading: healthLoading,
      mutate: refreshHealth
   } = useHealth();
   const { peers, isLoading: peersLoading, mutate: refreshPeers } = usePeers();
   const peersTestset = TEST_PEERS_DATASET;  // Use this instead of peers below for testing UI with cluster addresses
   const handleRefresh = () => {
      refreshHealth();
      refreshPeers();
   };
   const truSpaceVersion = process.env.TRUSPACE_VERSION ?? "unknown";

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
                  {config.disableAllAIFunctionality ? (
                     <div className="mb-4 p-3 rounded-md bg-gray-100 dark:bg-gray-700">
                        <div className="flex items-center gap-2">
                           <AlertTriangle className="w-14 h-14 sm:w-5 sm:h-5 text-yellow-700 dark:text-yellow-300" />
                           <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                              {t("appStatus.warningAIDisabled")}
                           </span>
                        </div>
                     </div>
                  ) : null}
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

         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
               <Globe className="w-6 h-6 text-purple-500" />
               {t("appStatus.nodeInformation")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gray-200 dark:md:divide-gray-700">
               <div className="space-y-4 md:pr-6">
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                     {t("appStatus.nodeIdentity")}
                  </div>
                  <div>
                     <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                           {t("appStatus.ipfsNodeId")}:
                        </span>
                        <span className="font-semibold flex items-center gap-2 flex-1 min-w-0">
                           {health?.nodeId ? (
                              <span className="flex items-center flex-1 min-w-0">
                                 <span className="truncate" title={health.nodeId}>
                                    {health.nodeId.slice(0, -4)}
                                 </span>
                                 <span className="shrink-0 pr-2" title={health.nodeId}>{health.nodeId.slice(-4)}</span>
                                 <CopyToClipboardButton value={health.nodeId} />
                              </span>
                           ) : (
                              t("appStatus.notAvailable")
                           )}
                        </span>
                     </div>
                  </div>
                  <div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {t("appStatus.clusterId")}:
                        </span>
                        <span className="font-semibold flex items-center gap-2 flex-1 min-w-0">
                            {health?.clusterId ? (
                              <span className="flex items-center flex-1 min-w-0">
                                 <span className="truncate" title={health.clusterId}>
                                    {health.clusterId.slice(0, -4)}
                                 </span>
                                 <span className="shrink-0 pr-2" title={health.clusterId}>{health.clusterId.slice(-4)}</span>
                                 <CopyToClipboardButton value={health.clusterId} />
                              </span>
                            ) : (
                              t("appStatus.notAvailable")
                            )}
                        </span>
                      </div>
                  </div>
                  <div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {t("appStatus.truSpaceVersion")}:
                        </span>
                        <span className="font-semibold flex items-center gap-2 flex-1 min-w-0">
                          {truSpaceVersion}
                        </span>
                      </div>
                  </div>
               </div>

               <div className="space-y-4 md:pl-6">
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                     {t("appStatus.nodeNetwork")}
                  </div>
                  <div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {t("appStatus.nodeMultiaddress")}:
                        </span>
                        <span className="font-normal flex items-center gap-2 flex-1 min-w-0">
                            {health?.nodeMultiaddress ? (
                              <span className="flex items-center flex-1 min-w-0">
                                 <span className="truncate" title={health.nodeMultiaddress}>
                                    {health.nodeMultiaddress.slice(0, -4)}
                                 </span>
                                 <span className="shrink-0 pr-2" title={health.nodeMultiaddress}>{health.nodeMultiaddress.slice(-4)}</span>
                                 <CopyToClipboardButton value={health.nodeMultiaddress} />
                              </span>
                            ) : (
                              t("appStatus.notAvailable")
                            )}
                        </span>
                      </div>
                  </div>
                  <div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {t("appStatus.clusterMultiaddress")}:
                        </span>
                        <span className="font-normal flex items-center gap-2 flex-1 min-w-0">
                            {health?.clusterMultiaddress ? (
                              <span className="flex items-center flex-1 min-w-0">
                                 <span className="truncate" title={health.clusterMultiaddress}>
                                    {health.clusterMultiaddress.slice(0, -4)}
                                 </span>
                                 <span className="shrink-0 pr-2" title={health.clusterMultiaddress}>{health.clusterMultiaddress.slice(-4)}</span>
                                 <CopyToClipboardButton value={health.clusterMultiaddress} />
                              </span>
                            ) : (
                              t("appStatus.notAvailable")
                            )}
                        </span>
                      </div>
                  </div>
                  <div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center gap-3">
                        <span className="font-normal  text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {t("appStatus.allClusterAddresses")}:
                        </span>
                        {peers && peers.length > 0 && peers[0].addresses ? (
                           <div className="font-normal flex items-center gap-2 flex-1 min-w-0">
                              {peers[0].addresses.length > 0 ? (
                                <details className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md w-full min-w-0">
                                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {peers[0].addresses.length} {t("appStatus.addresses")}...
                                  </summary>

                                  <div className="mt-2 space-y-1 w-full min-w-0">
                                    {peers[0].addresses.map((address, index) => (
                                      <div key={index} className="w-full min-w-0">
                                        <span className="flex items-center w-full min-w-0">
                                          <span className="truncate" title={address}>
                                            {address.slice(0, -4)}
                                          </span>
                                          <span className="shrink-0 pr-2" title={address}>
                                            {address.slice(-4)}
                                          </span>
                                          <CopyToClipboardButton value={address} />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              ) : (
                                 t("appStatus.notAvailable")
                              )}
                           </div>
                        ) : (
                          t("appStatus.notAvailable")
                        )}
                      </div>
                  </div>
               </div>
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
               <div className="grid grid-cols-2 gap-4">
                  {peers.slice(0, 5).map((peer: PeerNode, index: number) => (
                     <div
                        key={index}
                        className="px-2 py-1 border rounded-md bg-gray-100 dark:bg-gray-700 transition-colors"
                     >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            <span className="font-semibold">{t("appStatus.peer")} {index + 1}:</span>{" "}
                            {peer.peername}
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

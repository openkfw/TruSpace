import { checkMalwareScannerHealth } from '../../../shared/adapters/malware-scanning';
import { getHealthDb } from '../../../shared/clients/db';
import { oiClient } from '../../../shared/clients/oi-client';
import { config } from '../../../shared/config/config';
import { healthIpfsRepository } from '../infrastructure/health-ipfs.repository';

export async function getHealth() {
  const [
    clusterStatus,
    pinSvcStatus,
    gatewayStatus,
    oiStatus,
    ollamaStatus,
    dbStatus,
    malwareStatus,
    clusterId,
    ipifyResponse,
  ] = await Promise.all([
      (async () => {
        try {
          return await healthIpfsRepository.clusterStatus();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return await healthIpfsRepository.pinSvcStatus();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return await healthIpfsRepository.gatewayStatus();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return config.disableAllAIFunctionality ? false : await oiClient.health();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return config.disableAllAIFunctionality ? false : await oiClient.ollama.status();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return await getHealthDb();
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return config.malwareScanning.enabled ? await checkMalwareScannerHealth() : false;
        } catch {
          return false;
        }
      })(),
      (async () => {
        try {
          return await healthIpfsRepository.clusterId();
        } catch {
          return {
            id: '',
            addresses: [],
            cluster_peers: [],
            cluster_peers_addresses: [],
            version: '',
            commit: '',
            rpc_protocol_version: '',
            error: '',
            ipfs: { id: '', addresses: [], error: '' },
            peername: '',
          };
        }
      })(),
      (async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          if (!response.ok) {
            return { ip: '' };
          }
          return await response.json();
        } catch {
          return { ip: '' };
        }
      })(),
    ]);

  const malwareEnabled = config.malwareScanning.enabled;
  const malwareOk = malwareEnabled ? malwareStatus : true;
  const aiOk = config.disableAllAIFunctionality ? true : oiStatus && ollamaStatus;

  return {
    status: clusterStatus && pinSvcStatus && gatewayStatus && dbStatus && aiOk && malwareOk,
    services: {
      Backend: true,
      Database: dbStatus,
      'IPFS Cluster': clusterStatus,
      'IPFS Pinning Service': pinSvcStatus,
      'IPFS Gateway': gatewayStatus,
      'Open WebUI': config.disableAllAIFunctionality ? false : oiStatus,
      Ollama: config.disableAllAIFunctionality ? false : ollamaStatus,
      ...(malwareEnabled ? { 'Malware Scanner': malwareStatus } : {}),
    },
    version: config.version,
    nodeId: clusterId?.ipfs?.id || '',
    clusterId: clusterId?.id || '',
    clusterMultiaddress: `/ip4/${ipifyResponse?.ip}/tcp/9096/p2p/${clusterId?.id}`,
    nodeMultiaddress: `/ip4/${ipifyResponse?.ip}/tcp/4001/p2p/${clusterId?.ipfs?.id}`,
  };
}

import logger from '../../../shared/config/winston';
import { parseMultipleJson } from '../../../shared/infrastructure/ipfs/core/parsers';
import { clusterClient, gatewayClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';

export interface ClusterIdResponse {
  id: string;
  addresses: string[];
  cluster_peers: string[];
  cluster_peers_addresses: string[];
  version: string;
  commit: string;
  rpc_protocol_version: string;
  error: string;
  ipfs: {
    id: string;
    addresses: string[];
    error: string;
  };
  peername: string;
}

class HealthIpfsRepository {
  async pinSvcStatus(): Promise<boolean> {
    try {
      const pinSvcStatus = (await pinSvcClient.get('/pins?limit=10')).status;
      return pinSvcStatus === 200;
    } catch (error) {
      logger.error('Error checking pinSvc status:', error);
      return false;
    }
  }

  async gatewayStatus(): Promise<boolean> {
    try {
      const status = (
        await gatewayClient.get('/', {
          validateStatus: function () {
            return true;
          },
        })
      ).status;

      return status < 500;
    } catch (error) {
      logger.error('Error checking gateway status:', error);
      return false;
    }
  }

  async clusterStatus(): Promise<boolean> {
    try {
      const clusterSvcStatus = await clusterClient.get('/health');
      return clusterSvcStatus.status === 204;
    } catch (error) {
      logger.error('Error checking cluster status:', error);
      return false;
    }
  }

  async clusterId(): Promise<ClusterIdResponse> {
    try {
      return (await clusterClient.get('/id')).data;
    } catch (error) {
      logger.error('Error getting cluster ID:', error);
      throw error;
    }
  }

  async getPeers() {
    try {
      const response = await clusterClient.get('/peers');
      return parseMultipleJson(response.data);
    } catch (error) {
      logger.error('Error getting peers:', error);
      throw error;
    }
  }
}

export const healthIpfsRepository = new HealthIpfsRepository();

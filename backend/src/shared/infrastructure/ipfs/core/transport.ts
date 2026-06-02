import axios from 'axios';

import { attachHttpClientLogging } from '../../../logging/http-client-logging';
import { ipfsConfig } from './config';

export const pinSvcClient = axios.create({
  baseURL: ipfsConfig.pinSvcBaseUrl,
});

export const clusterClient = axios.create({
  baseURL: ipfsConfig.clusterApiBaseUrl,
});

export const gatewayClient = axios.create({
  baseURL: ipfsConfig.gatewayApiBaseUrl,
});

attachHttpClientLogging(pinSvcClient, 'ipfs-pinning-service');
attachHttpClientLogging(clusterClient, 'ipfs-cluster');
attachHttpClientLogging(gatewayClient, 'ipfs-gateway');

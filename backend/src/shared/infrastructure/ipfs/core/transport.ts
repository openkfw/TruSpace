import axios from 'axios';

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

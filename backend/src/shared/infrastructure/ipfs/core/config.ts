import { config } from '../../../config/config';
import { IpfsClientConfig } from '../../../types/interfaces';

const { ipfsPinningServiceHost, ipfsClusterHost, ipfsGatewayHost, maxNumberOfFetchedPins } = config;

export const ipfsConfig: IpfsClientConfig = {
  pinSvcBaseUrl: ipfsPinningServiceHost,
  clusterApiBaseUrl: ipfsClusterHost,
  gatewayApiBaseUrl: ipfsGatewayHost,
};

export { maxNumberOfFetchedPins };

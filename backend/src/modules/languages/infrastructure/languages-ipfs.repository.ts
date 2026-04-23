import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { LanguageRequest } from '../../../shared/types/interfaces/truspace';

class LanguagesIpfsRepository {
  async createLanguage(langRequest: LanguageRequest): Promise<string> {
    try {
      const form = createJsonFormData(langRequest);
      const metadataQuery = buildMetadataQuery(langRequest.meta);

      const clusterResp = await clusterClient.post(`/add?stream-channels=false${metadataQuery}`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating language:', error);
      throw error;
    }
  }

  async getLanguageByVersionCid(versionCid: string): Promise<string | undefined> {
    try {
      const res = await pinSvcClient.get(`/pins?limit=1&meta={"type":"language","versionCid":"${versionCid}"}`);

      if (res.data?.results?.length > 0) {
        return res.data.results[0].pin.meta.language;
      }

      return undefined;
    } catch (error) {
      logger.error(`Error fetching language for version CID ${versionCid}:`, error);
      throw error;
    }
  }
}

export const languagesIpfsRepository = new LanguagesIpfsRepository();

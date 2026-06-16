import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { LanguageRequest } from '../../../shared/types/interfaces/truspace';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;

  let result: AllocationPin[] = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((l) => { try { return JSON.parse(l); } catch(_e) { return null; } })
      .filter(Boolean);
  } else if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.allocations)) {
    result = data.allocations;
  }

  if (primaryFilter) {
    result = result.filter((a) => a.metadata && a.metadata[primaryFilter.key] === primaryFilter.value);
  }

  return result;
}

// Cache language lookups — language for a given CID never changes.
const languageCache = new Map<string, string | undefined>();

class LanguagesIpfsRepository {
  async createLanguage(langRequest: LanguageRequest): Promise<string> {
    try {
      const form = createJsonFormData(langRequest);
      const metadataQuery = buildMetadataQuery(langRequest.meta);
      const clusterResp = await clusterClient.post('/add?stream-channels=false' + metadataQuery, form, {
        headers: { ...form.getHeaders() },
      });
      if (langRequest.meta?.versionCid) {
        languageCache.delete(langRequest.meta.versionCid);
      }
      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error('Error creating language:', error);
      throw error;
    }
  }

  async getLanguageByVersionCid(versionCid: string): Promise<string | undefined> {
    if (languageCache.has(versionCid)) {
      logger.debug('[languages.getLanguageByVersionCid] cache hit for ' + versionCid);
      return languageCache.get(versionCid);
    }

    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'language' });
      const match = allocations.find((a) => a.metadata?.versionCid === versionCid);
      const language = match?.metadata?.language;
      logger.info('[languages.getLanguageByVersionCid] fetch=' + (Date.now() - t0) + 'ms, found=' + (language ?? 'none'));
      languageCache.set(versionCid, language);
      return language;
    } catch (error) {
      logger.error('Error fetching language for version CID ' + versionCid + ':', error);
      throw error;
    }
  }
}

export const languagesIpfsRepository = new LanguagesIpfsRepository();
import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToPerspective } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, gatewayClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { PinRequest, PinningResponse } from '../../../shared/types/interfaces';
import { Perspective, PerspectiveRequest } from '../../../shared/types/interfaces/truspace';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

class PerspectivesIpfsRepository {
  async createPerspective(perspective: PerspectiveRequest): Promise<string> {
    try {
      const perspectiveMeta = { ...perspective.meta };
      delete perspectiveMeta.creatorName;

      const form = createJsonFormData({ ...perspective, meta: perspectiveMeta });
      const metadataQuery = buildMetadataQuery(perspectiveMeta);

      const clusterResp = await clusterClient.post(`/add?stream-channels=false${metadataQuery}`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      return clusterResp.data[0].cid;
    } catch (error) {
      logger.error(`Error storing perspective in IPFS! ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  async getPerspectivesByDocumentId(docId: string): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"perspective","docId":"${docId}"}`)
      ).data;

      const perspectives = pinRes.results.map((pinRequest: PinRequest) => transformPinToPerspective(pinRequest.pin));

      return await this.#enrichPerspectives(perspectives);
    } catch (error) {
      logger.error(`Error getting perspectives by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getPerspectivesByVersionCid(cid: string): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"perspective","versionCid":"${cid}"}`)
      ).data;

      const perspectives = pinRes.results.map((pinRequest: PinRequest) => transformPinToPerspective(pinRequest.pin));
      const enriched = await this.#enrichPerspectives(perspectives);

      return enriched.sort(
        (a: Perspective, b: Perspective) =>
          Number(new Date(a.meta.timestamp).getTime()) - Number(new Date(b.meta.timestamp).getTime()),
      );
    } catch (error) {
      logger.error(`Error getting perspectives by version CID ${cid}:`, error);
      throw error;
    }
  }

  async getAllPerspectives(): Promise<Perspective[]> {
    try {
      const pinRes: PinningResponse = (await pinSvcClient.get('/pins?limit=1000&meta={"type":"perspective"}')).data;

      const perspectives = pinRes.results.map((pinRequest: PinRequest) => transformPinToPerspective(pinRequest.pin));

      return await this.#enrichPerspectives(perspectives);
    } catch (error) {
      logger.error('Error getting all perspectives:', error);
      throw error;
    }
  }

  async #enrichPerspectives(perspectives: Perspective[]): Promise<Perspective[]> {
    const fetched = await this.#fetchPerspectiveFiles(perspectives);

    return await Promise.all(
      fetched.map(async (perspective) => {
        const userData = await usersIpfsRepository.getUserData(
          perspective.meta.creatorNodeId,
          perspective.meta.creatorUserId,
        );

        return {
          ...perspective,
          meta: {
            ...perspective.meta,
            creatorName:
              (perspective.meta.creatorType ?? 'user') === 'user' ? userData.userName : perspective.meta.creatorUserId,
          },
        };
      }),
    );
  }

  async #fetchPerspectiveFiles(perspectives: Perspective[]): Promise<Perspective[]> {
    try {
      const perspectiveFilesResponse = await Promise.all(
        perspectives.map(async (perspective) => {
          try {
            const response = await gatewayClient.get(`/ipfs/${perspective.cid}`);

            return {
              ...response.data,
              cid: perspective.cid,
            } as Perspective;
          } catch (error) {
            logger.error(`Error fetching perspective file ${perspective.cid}:`, error);
            return null;
          }
        }),
      );

      return perspectiveFilesResponse.filter((perspective): perspective is Perspective => perspective !== null);
    } catch (error) {
      logger.error('Error fetching perspective files:', error);
      throw error;
    }
  }
}

export const perspectivesIpfsRepository = new PerspectivesIpfsRepository();

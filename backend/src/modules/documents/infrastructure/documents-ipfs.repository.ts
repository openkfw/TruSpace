import logger from '../../../shared/config/winston';
import { maxNumberOfFetchedPins } from '../../../shared/infrastructure/ipfs/core/config';
import { pinsToUniqueDocuments, transformPinToDocument } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { DocumentPinRequest, DocumentPinningResponse } from '../../../shared/types/interfaces';
import { Document, DocumentsResponse, DocumentWithVersions } from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { languagesIpfsRepository } from '../../languages/infrastructure/languages-ipfs.repository';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

class DocumentsIpfsRepository {
  async getDocumentVersionDetailsByCid(cid: string): Promise<Document> {
    try {
      const safeCid = assertAndEncodeURIComponent(cid);
      const clusterRes = (await clusterClient.get(`/allocations/${safeCid}`)).data;
      const language = await this.#getLanguageForVersion(cid);
      const userData = await usersIpfsRepository.getUserData(
        clusterRes.metadata.creatorNodeId || '',
        clusterRes.metadata.creatorUserId || '',
      );

      return {
        docId: clusterRes.metadata.docId,
        cid: clusterRes.cid,
        meta: {
          creatorNodeId: clusterRes.metadata.creatorNodeId || '',
          creatorUserId: clusterRes.metadata.creatorUserId || '',
          creatorName: userData.userName,
          workspaceOrigin: clusterRes.metadata.workspaceOrigin,
          filename: clusterRes.metadata.filename,
          timestamp: clusterRes.metadata.timestamp,
          version: clusterRes.metadata.version,
          encrypted: clusterRes.metadata.encrypted,
          language,
          size: clusterRes.metadata.size ? Number(clusterRes.metadata.size) : undefined,
          versionTagName: clusterRes.metadata.versionTagName || '',
        },
      };
    } catch (error) {
      logger.error(`Error getting document version details for CID ${cid}:`, error);
      throw error;
    }
  }

  async getDocumentDetailsById(docId: string): Promise<DocumentWithVersions> {
    try {
      const res = await pinSvcClient.get(`/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`);
      const documentPins = res.data.results as DocumentPinRequest[];

      let documentVersions = await Promise.all(
        documentPins.map((pinRequest) => this.#createDetailedDocumentFromPin(pinRequest)),
      );

      documentVersions = documentVersions.sort((a, b) => Number(b.meta.timestamp) - Number(a.meta.timestamp));

      if (documentVersions.length === 0) {
        logger.warn(`No document versions found for docId: ${docId}. Returning minimal structure.`);
        return {
          docId,
          cid: '',
          meta: {
            filename: '',
            timestamp: '',
            version: '',
            creatorNodeId: '',
            creatorUserId: '',
            workspaceOrigin: '',
            language: undefined,
            size: 0,
            encrypted: 'false',
            versionTagName: '',
          },
          documentVersions: [],
        };
      }

      return { ...documentVersions[0], documentVersions };
    } catch (error) {
      logger.error(`Error getting document details for docId ${docId}:`, error);
      throw error;
    }
  }

  async getDocumentsByDocumentId(docId: string): Promise<Document[]> {
    try {
      const res = await pinSvcClient.get(`/pins?limit=1000&meta={"type":"document","docId":"${docId}"}`);
      const documentPins = res.data.results as DocumentPinRequest[];

      return await Promise.all(documentPins.map((pinRequest) => this.#createDetailedDocumentFromPin(pinRequest)));
    } catch (error) {
      logger.error(`Error getting documents by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getAllDocuments(from: number = 0, limit: number = 100): Promise<DocumentsResponse> {
    try {
      const pinRes: DocumentPinningResponse = (
        await pinSvcClient.get(`/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"document"}`)
      ).data;

      const count = pinRes.count || 0;
      const result = pinsToUniqueDocuments(pinRes.results);
      const sliced = result.slice(from, from + limit);
      const data = await Promise.all(sliced.map((document) => this.#enrichDocumentCreator(document)));

      return {
        count,
        from,
        limit,
        data,
      };
    } catch (error) {
      logger.error('Error getting all documents:', error);
      throw error;
    }
  }

  async getDocumentsByWorkspace(
    workspaceId: string,
    from: number,
    limit: number,
    searchString: string = '',
  ): Promise<DocumentsResponse> {
    try {
      const pinRes: DocumentPinningResponse = (
        await pinSvcClient.get(
          `/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"document","workspaceOrigin":"${workspaceId}"}`,
        )
      ).data;

      const result = pinsToUniqueDocuments(pinRes.results);
      const filteredResult = result.filter((document) =>
        searchString && searchString.length > 0
          ? document.meta.filename.toLowerCase().includes(searchString.toLowerCase())
          : true,
      );
      const sliced = filteredResult.slice(from, from + limit);
      const data = await Promise.all(sliced.map((document) => this.#enrichDocumentCreator(document)));

      return {
        data,
        count: filteredResult.length,
      };
    } catch (error) {
      logger.error(`Error getting documents by workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async #createDetailedDocumentFromPin(pinRequest: DocumentPinRequest): Promise<Document> {
    const language = await this.#getLanguageForVersion(pinRequest.pin.cid);
    const document = transformPinToDocument(pinRequest.pin, language);
    return this.#enrichDocumentCreator(document);
  }

  async #enrichDocumentCreator(document: Document): Promise<Document> {
    const userData = await usersIpfsRepository.getUserData(document.meta.creatorNodeId, document.meta.creatorUserId);

    return {
      ...document,
      meta: {
        ...document.meta,
        creatorName: userData.userName,
      },
    };
  }

  async #getLanguageForVersion(versionCid: string): Promise<string | undefined> {
    try {
      return await languagesIpfsRepository.getLanguageByVersionCid(versionCid);
    } catch (error) {
      logger.error(`Error fetching language for version CID ${versionCid}:`, error);
      return undefined;
    }
  }
}

export const documentsIpfsRepository = new DocumentsIpfsRepository();

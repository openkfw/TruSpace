// @ts-nocheck
import { Response } from 'express';

import { getWorkspacePasswordDb } from '../../../shared/clients/db';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { decrypt } from '../../../shared/encryption';
import { buildMetadataQuery, createFileFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import {
  pinsToUniqueDocuments,
  transformPinToDocument,
  transformPinToGeneralWorkspaceItem,
} from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, gatewayClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { AuthenticatedRequest } from '../../../shared/types';
import { DocumentPinRequest } from '../../../shared/types/interfaces';
import {
  Document,
  DocumentCreateResponse,
  DocumentRequest,
  DocumentsResponse,
  DocumentWithVersions,
  File,
  GeneralTemplateOfItemInWorkspace,
} from '../../../shared/types/interfaces/truspace';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { languagesIpfsRepository } from '../../languages/infrastructure/languages-ipfs.repository';
import { tagsIpfsRepository } from '../../tags/infrastructure/tags-ipfs.repository';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

interface AllocationPin {
  cid: string;
  metadata: Record<string, string>;
}

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const t0 = Date.now();
  const url = '/allocations?local=true';

  const res = await clusterClient.get(url);
  const data = res.data;

  let result: AllocationPin[] = [];

  if (typeof data === 'string') {
    const lines = data.split('\n').filter((l) => l.trim().length > 0);
    result = lines
      .map((l) => { try { return JSON.parse(l); } catch(e) { logger.warn('NDJSON parse error: ' + l.slice(0, 100)); return null; } })
      .filter(Boolean);
  } else if (Array.isArray(data)) {
    result = data;
  } else if (data && typeof data === 'object' && Array.isArray(data.allocations)) {
    result = data.allocations;
  } else {
    logger.warn('fetchLocalAllocations: unrecognised response shape');
  }

  const fetchMs = Date.now() - t0;

  if (primaryFilter) {
    const before = result.length;
    result = result.filter((a) => a.metadata && a.metadata[primaryFilter.key] === primaryFilter.value);
    logger.info('[fetchLocalAllocations] fetch=' + fetchMs + 'ms total=' + before + ' after filter(' + primaryFilter.key + '=' + primaryFilter.value + ')=' + result.length);
  } else {
    logger.info('[fetchLocalAllocations] fetch=' + fetchMs + 'ms total=' + result.length + ' (no filter)');
  }

  return result;
}

function allocationToDocumentPinRequest(alloc: AllocationPin): DocumentPinRequest {
  const meta = { app_id: '', ...(alloc.metadata ?? {}) };
  const adapted: any = { requestid: alloc.cid, status: 'pinned', pin: { cid: alloc.cid, meta } };
  return adapted as DocumentPinRequest;
}

class DocumentsIpfsRepository {
  async createDocument(doc: DocumentRequest, file: File): Promise<DocumentCreateResponse> {
    try {
      const form = createFileFormData(file);
      const docMeta = { ...doc.meta };
      delete docMeta.creatorName;
      const metadataQuery = buildMetadataQuery(docMeta, { encodeValueKeys: ['filename'] });

      const result = await clusterClient.post(
        `/add?stream-channels=false&name=${encodeURIComponent(file.name)}${metadataQuery}&meta-docId=${doc.docId}&meta-type=document`,
        form,
        { headers: { ...form.getHeaders() }, timeout: 30000, maxContentLength: Infinity },
      );
      const data = result.data[0];
      return { cid: data.cid, uuid: doc.docId };
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  async getDocumentVersionDetailsByCid(cid: string): Promise<Document> {
    const t0 = Date.now();
    try {
      const safeCid = assertAndEncodeURIComponent(cid);
      const clusterRes = (await clusterClient.get(`/allocations/${safeCid}?local=true`)).data;
      logger.info('[getDocumentVersionDetailsByCid] allocation lookup=' + (Date.now() - t0) + 'ms');

      const t1 = Date.now();
      const [language, userData] = await Promise.all([
        this.#getLanguageForVersion(cid),
        usersIpfsRepository.getUserData(clusterRes.metadata.creatorNodeId || '', clusterRes.metadata.creatorUserId || ''),
      ]);
      logger.info('[getDocumentVersionDetailsByCid] language+user lookup=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');

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
          malwareScanStatus: clusterRes.metadata.malwareScanStatus,
          malwareScanProvider: clusterRes.metadata.malwareScanProvider,
          malwareScanTimestamp: clusterRes.metadata.malwareScanTimestamp,
        },
      };
    } catch (error) {
      logger.error(`Error getting document version details for CID ${cid}:`, error);
      throw error;
    }
  }

  async downloadDocumentVersionByCid(req: AuthenticatedRequest, res: Response, cid: string): Promise<void> {
    try {
      const document = await this.getDocumentVersionDetailsByCid(cid);
      const metadata = document.meta;

      await checkPermissionForWorkspace(req.user?.email as string, res, metadata.workspaceOrigin);

      const safeCid = assertAndEncodeURIComponent(cid);
      const result = await gatewayClient.get(`/ipfs/${safeCid}`, { responseType: 'arraybuffer' });

      const fileBuffer = Buffer.from(result.data);
      let modifiedBuffer = fileBuffer;
      if (metadata.encrypted === 'true') {
        modifiedBuffer = await decrypt(fileBuffer, await this.#getWorkspacePassword(metadata.workspaceOrigin));
      }

      const contentType = result.headers['content-type'];
      res.setHeader('Content-Type', typeof contentType === 'string' ? contentType : 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(metadata.filename) || cid}"`);
      res.end(modifiedBuffer);
    } catch (error) {
      logger.error(error);
      res.status(404);
    }
  }

  async getDocumentVersionContentByCid(cid: string): Promise<{ data: Buffer; size: number }> {
    try {
      const document = await this.getDocumentVersionDetailsByCid(cid);
      const metadata = document.meta;

      const safeCid = assertAndEncodeURIComponent(cid);
      const result = await gatewayClient.get(`/ipfs/${safeCid}`, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(result.data);

      let modifiedBuffer = fileBuffer;
      if (metadata.encrypted === 'true') {
        modifiedBuffer = await decrypt(fileBuffer, metadata.workspaceOrigin);
      }

      return { data: modifiedBuffer, size: Number(metadata.size) };
    } catch (error) {
      logger.error(`Error getting document version content for CID ${cid}:`, error);
      throw error;
    }
  }

  async getDocumentDetailsById(docId: string): Promise<DocumentWithVersions> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'document' });
      const documentPins = allocations.filter((a) => a.metadata?.docId === docId).map(allocationToDocumentPinRequest);
      logger.info('[getDocumentDetailsById] allocations=' + (Date.now() - t0) + 'ms, versions=' + documentPins.length);

      const t1 = Date.now();
      let documentVersions = await Promise.all(
        documentPins.map((pinRequest) => this.#createDetailedDocumentFromPin(pinRequest)),
      );
      logger.info('[getDocumentDetailsById] enrich all versions=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');

      documentVersions = documentVersions.sort((a, b) => Number(b.meta.timestamp) - Number(a.meta.timestamp));

      if (documentVersions.length === 0) {
        logger.warn(`No document versions found for docId: ${docId}. Returning minimal structure.`);
        return {
          docId, cid: '',
          meta: { filename: '', timestamp: '', version: '', creatorNodeId: '', creatorUserId: '', workspaceOrigin: '', language: undefined, size: 0, encrypted: 'false', versionTagName: '', malwareScanStatus: undefined, malwareScanProvider: undefined, malwareScanTimestamp: undefined },
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
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'document' });
      const documentPins = allocations.filter((a) => a.metadata?.docId === docId).map(allocationToDocumentPinRequest);
      logger.info('[getDocumentsByDocumentId] allocations=' + (Date.now() - t0) + 'ms, pins=' + documentPins.length);

      const t1 = Date.now();
      const result = await Promise.all(documentPins.map((pinRequest) => this.#createDetailedDocumentFromPin(pinRequest)));
      logger.info('[getDocumentsByDocumentId] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error(`Error getting documents by document ID ${docId}:`, error);
      throw error;
    }
  }

  async getAllocationsByDocId(docId: string) {
    const allocations = await fetchLocalAllocations();
    return allocations.filter((a) => a.metadata?.docId === docId);
  }

  async countDocumentVersions(docId: string): Promise<number> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'document' });
      const count = allocations.filter((a) => a.metadata?.docId === docId).length;
      logger.info('[countDocumentVersions] fetch=' + (Date.now() - t0) + 'ms, versions=' + count);
      return count;
    } catch (error) {
      logger.error('Error counting document versions for docId ' + docId + ':', error);
      return 0;
    }
  }

  async getAllDocuments(from: number = 0, limit: number = 100): Promise<DocumentsResponse> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'document' });
      const count = allocations.length;
      const asPinRequests = allocations.map(allocationToDocumentPinRequest);
      const result = pinsToUniqueDocuments(asPinRequests);
      logger.info('[getAllDocuments] allocations+dedup=' + (Date.now() - t0) + 'ms, unique=' + result.length);

      const sliced = result.slice(from, from + limit);
      const t1 = Date.now();
      const data = await Promise.all(sliced.map((document) => this.#enrichDocumentCreator(document)));
      logger.info('[getAllDocuments] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');

      return { count, from, limit, data };
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
    tagFilter: string[] = [],
    creatorFilter: string[] = [],
    sortBy: 'name' | 'timestamp' = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<DocumentsResponse> {
    const t0 = Date.now();
    try {
      const tagsTimeout = new Promise<[]>((resolve) => setTimeout(() => resolve([]), 5000));
      const [allocations, workspaceTags] = await Promise.all([
        fetchLocalAllocations({ key: 'type', value: 'document' }),
        Promise.race([tagsIpfsRepository.getTagsByWorkspaceId(workspaceId), tagsTimeout]),
      ]);
      logger.info('[getDocumentsByWorkspace] fetch+tags=' + (Date.now() - t0) + 'ms, allocations=' + allocations.length + ' tags=' + workspaceTags.length);

      const t1 = Date.now();
      const workspaceAllocations = allocations.filter((a) => a.metadata?.workspaceOrigin === workspaceId);
      const asPinRequests = workspaceAllocations.map(allocationToDocumentPinRequest);
      const allDocs = pinsToUniqueDocuments(asPinRequests);
      logger.info('[getDocumentsByWorkspace] filter+dedup=' + (Date.now() - t1) + 'ms, workspace=' + workspaceAllocations.length + ' unique=' + allDocs.length);

      // Group tags by docId
      const tagsByDocId = new Map<string, { name: string; color: string }[]>();
      for (const tag of workspaceTags) {
        const existing = tagsByDocId.get(tag.meta.docId) ?? [];
        existing.push({ name: tag.meta.name, color: tag.meta.color });
        tagsByDocId.set(tag.meta.docId, existing);
      }

      // Build creator name map in parallel
      const t2 = Date.now();
      const uniqueCreatorIds = new Map<string, { nodeId: string; userId: string }>();
      for (const doc of allDocs) {
        const key = doc.meta.creatorNodeId + ':' + doc.meta.creatorUserId;
        if (!uniqueCreatorIds.has(key)) {
          uniqueCreatorIds.set(key, { nodeId: doc.meta.creatorNodeId, userId: doc.meta.creatorUserId });
        }
      }
      const creatorEntries = [...uniqueCreatorIds.entries()];
      const userDataResults = await Promise.all(
        creatorEntries.map(([, { nodeId, userId }]) => usersIpfsRepository.getUserData(nodeId, userId)),
      );
      const creatorNameMap = new Map<string, string>();
      creatorEntries.forEach(([key], i) => { creatorNameMap.set(key, userDataResults[i].userName); });
      logger.info('[getDocumentsByWorkspace] creator lookup=' + (Date.now() - t2) + 'ms, unique creators=' + creatorEntries.length);

      // Filter
      const search = searchString?.toLowerCase() ?? '';
      const filteredResult = allDocs.filter((doc) => {
        const docTags = tagsByDocId.get(doc.docId) ?? [];
        const creatorKey = doc.meta.creatorNodeId + ':' + doc.meta.creatorUserId;
        const creatorName = (creatorNameMap.get(creatorKey) ?? '').toLowerCase();
        const filename = (doc.meta.filename ?? '').toLowerCase();
        const matchesSearch = !search || filename.includes(search) || creatorName.includes(search) || docTags.some((t) => (t.name ?? '').toLowerCase().includes(search));
        const matchesTags = tagFilter.length === 0 || tagFilter.some((tf) => docTags.some((t) => t.name === tf));
        const matchesCreator = creatorFilter.length === 0 || creatorFilter.includes(creatorNameMap.get(creatorKey) ?? '');
        return matchesSearch && matchesTags && matchesCreator;
      });

      // Sort
      filteredResult.sort((a, b) => {
        const cmp = sortBy === 'name'
          ? a.meta.filename.localeCompare(b.meta.filename)
          : Number(a.meta.timestamp) - Number(b.meta.timestamp);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      // Available filter options
      const availableTagsMap = new Map<string, { name: string; color: string }>();
      for (const tags of tagsByDocId.values()) {
        for (const tag of tags) {
          if (!availableTagsMap.has(tag.name)) availableTagsMap.set(tag.name, tag);
        }
      }
      const availableTags = [...availableTagsMap.values()];
      const availableCreators = [
        ...new Set(
          allDocs
            .map((doc) => creatorNameMap.get(doc.meta.creatorNodeId + ':' + doc.meta.creatorUserId) ?? '')
            .filter((name) => name && name !== 'UNKNOWN'),
        ),
      ];

      // Paginate — reuse creatorNameMap, no extra async calls needed
      const count = filteredResult.length;
      const sliced = filteredResult.slice(from, from + limit);
      const data = sliced.map((doc) => {
        const creatorKey = doc.meta.creatorNodeId + ':' + doc.meta.creatorUserId;
        return {
          ...doc,
          meta: { ...doc.meta, creatorName: creatorNameMap.get(creatorKey) ?? doc.meta.creatorName ?? 'UNKNOWN' },
          tags: tagsByDocId.get(doc.docId) ?? [],
        };
      });

      logger.info('[getDocumentsByWorkspace] total=' + (Date.now() - t0) + 'ms, returning count=' + count + ' data=' + data.length);
      return { data, count, from, limit, availableTags, availableCreators };
    } catch (error) {
      logger.error('Error getting documents by workspace ' + workspaceId + ':', error);
      throw error;
    }
  }

  async getEverythingByDocId(docId: string): Promise<GeneralTemplateOfItemInWorkspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations();
      const matching = allocations.filter((a) => a.metadata?.docId === docId);
      logger.info('[getEverythingByDocId] fetch=' + (Date.now() - t0) + 'ms, matching=' + matching.length);
      return matching.map((alloc) => transformPinToGeneralWorkspaceItem({ cid: alloc.cid, meta: alloc.metadata ?? {} }));
    } catch (error) {
      logger.error(`Error getting everything by doc ID ${docId}:`, error);
      throw error;
    }
  }

  async deletePins(itemCids: string[]): Promise<void> {
    try {
      await Promise.all(itemCids.map((itemCid) => clusterClient.delete(`/pins/${assertAndEncodeURIComponent(itemCid)}`)));
    } catch (error) {
      logger.error('Error deleting document-related pins:', error);
      throw error;
    }
  }

  async #createDetailedDocumentFromPin(pinRequest: DocumentPinRequest): Promise<Document> {
    const [language, document] = await Promise.all([
      this.#getLanguageForVersion(pinRequest.pin.cid),
      Promise.resolve(transformPinToDocument(pinRequest.pin, undefined)),
    ]);
    const doc = transformPinToDocument(pinRequest.pin, language);
    return this.#enrichDocumentCreator(doc);
  }

  async #enrichDocumentCreator(document: Document): Promise<Document> {
    const userData = await usersIpfsRepository.getUserData(document.meta.creatorNodeId, document.meta.creatorUserId);
    return { ...document, meta: { ...document.meta, creatorName: userData.userName } };
  }

  async #getLanguageForVersion(versionCid: string): Promise<string | undefined> {
    try {
      return await languagesIpfsRepository.getLanguageByVersionCid(versionCid);
    } catch (error) {
      logger.error(`Error fetching language for version CID ${versionCid}:`, error);
      return undefined;
    }
  }

  async #getWorkspacePassword(workspaceId: string): Promise<string> {
    const encryptedWorkspacePassword = await getWorkspacePasswordDb(workspaceId);
    if (!encryptedWorkspacePassword?.encrypted_password) {
      logger.warn('Missing encryption password. Trying workspaceId ...');
      return workspaceId;
    }
    const workspacePassword = await decrypt(encryptedWorkspacePassword.encrypted_password, config.masterPassword);
    return workspacePassword.toString();
  }
}

export const documentsIpfsRepository = new DocumentsIpfsRepository();
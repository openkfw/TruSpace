// @ts-nocheck
import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToGeneralWorkspaceItem, transformPinToWorkspace } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import {
  GeneralTemplateOfItemInWorkspace,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }) {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;

  let result = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      .map((l) => { try { return JSON.parse(l); } catch(e) { return null; } })
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

class WorkspacesIpfsRepository {
  async createWorkspace(workspace: WorkspaceRequest): Promise<WorkspaceCreateResponse> {
    try {
      const workspaceMeta = { ...workspace.meta };
      delete workspaceMeta.creatorName;

      const form = createJsonFormData({ ...workspace, meta: workspaceMeta }, { filename: workspace.uuid });
      const metadataQuery = buildMetadataQuery(workspaceMeta, { encodeValueKeys: ['name'] });

      const result = await clusterClient.post(
        '/add?stream-channels=false&name=' + workspace.uuid + metadataQuery,
        form,
        { headers: { ...form.getHeaders() } },
      );

      const data = result.data[0];
      return { cid: data.cid, uuid: data.name };
    } catch (error) {
      logger.error('Error creating workspace:', error);
      throw error;
    }
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'workspace' });
      const sorted = allocations.sort((a, b) => (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? ''));
      logger.info('[workspaces.getAllWorkspaces] fetch=' + (Date.now() - t0) + 'ms, count=' + allocations.length);
      const t1 = Date.now();
      const result = await this.#enrichWorkspaces(sorted);
      logger.info('[workspaces.getAllWorkspaces] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting workspace pins: ' + JSON.stringify(error));
      return [];
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'workspace' });
      const filtered = allocations.filter((a) => a.metadata?.workspace_uuid === workspaceId);
      logger.info('[workspaces.getWorkspaceById] fetch=' + (Date.now() - t0) + 'ms, total=' + allocations.length + ' filtered=' + filtered.length);
      const t1 = Date.now();
      const result = await this.#enrichWorkspaces(filtered);
      logger.info('[workspaces.getWorkspaceById] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting workspace by ID ' + workspaceId + ':', error);
      throw error;
    }
  }

  async getWorkspaceByName(name: string): Promise<Workspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'workspace' });
      const filtered = allocations.filter((a) => a.metadata?.name === encodeURIComponent(name) || a.metadata?.name === name);
      logger.info('[workspaces.getWorkspaceByName] fetch=' + (Date.now() - t0) + 'ms, filtered=' + filtered.length);
      const t1 = Date.now();
      const result = await this.#enrichWorkspaces(filtered);
      logger.info('[workspaces.getWorkspaceByName] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting workspace by name ' + name + ':', error);
      throw error;
    }
  }

  async getPublicWorkspaces(): Promise<Workspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'workspace' });
      const filtered = allocations.filter((a) => a.metadata?.is_public === 'true');
      logger.info('[workspaces.getPublicWorkspaces] fetch=' + (Date.now() - t0) + 'ms, filtered=' + filtered.length);
      const t1 = Date.now();
      const result = await this.#enrichWorkspaces(filtered);
      logger.info('[workspaces.getPublicWorkspaces] enrich=' + (Date.now() - t1) + 'ms total=' + (Date.now() - t0) + 'ms');
      return result;
    } catch (error) {
      logger.error('Error getting public workspaces:', error);
      throw error;
    }
  }

  async updateWorkspaceType(workspaceId: string, isPublic: boolean): Promise<void> {
    try {
      const workspace = await this.getWorkspaceById(workspaceId);
      const pinRequest: WorkspaceRequest = {
        uuid: workspaceId,
        meta: { ...workspace[0].meta, is_public: isPublic, type: 'workspace' },
      };
      await this.createWorkspace(pinRequest);
      await clusterClient.delete('/pins/' + workspace[0].cid);
    } catch (error) {
      logger.error('Error updating workspace type for ' + workspaceId + ':', error);
      throw error;
    }
  }

  async getEverythingInWorkspace(workspaceId: string): Promise<GeneralTemplateOfItemInWorkspace[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations();
      const filtered = allocations.filter((a) => a.metadata?.workspaceOrigin === workspaceId);
      logger.info('[workspaces.getEverythingInWorkspace] fetch=' + (Date.now() - t0) + 'ms, total=' + allocations.length + ' filtered=' + filtered.length);
      return filtered.map((a) => transformPinToGeneralWorkspaceItem({ cid: a.cid, meta: a.metadata ?? {} }));
    } catch (error) {
      logger.error('Error getting everything in workspace ' + workspaceId + ':', error);
      throw error;
    }
  }

  async deleteWorkspacePin(workspaceCid: string): Promise<void> {
    try {
      await clusterClient.delete('/pins/' + assertAndEncodeURIComponent(workspaceCid));
    } catch (error) {
      logger.error('Error deleting workspace pin ' + workspaceCid + ':', error);
      throw error;
    }
  }

  async #enrichWorkspaces(allocations): Promise<Workspace[]> {
    return await Promise.all(
      allocations.map(async (alloc) => {
        const workspace = transformPinToWorkspace({ cid: alloc.cid, meta: alloc.metadata ?? {} });
        const userData = await usersIpfsRepository.getUserData(workspace.meta.creatorNodeId, workspace.meta.creatorUserId);
        return { ...workspace, meta: { ...workspace.meta, creatorName: userData.userName } };
      }),
    );
  }
}

export const workspacesIpfsRepository = new WorkspacesIpfsRepository();
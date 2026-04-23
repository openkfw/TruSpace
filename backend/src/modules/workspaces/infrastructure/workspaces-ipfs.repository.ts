import logger from '../../../shared/config/winston';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { transformPinToGeneralWorkspaceItem, transformPinToWorkspace } from '../../../shared/infrastructure/ipfs/core/mappers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { PinRequest, PinningResponse } from '../../../shared/types/interfaces';
import {
  GeneralTemplateOfItemInWorkspace,
  Workspace,
  WorkspaceCreateResponse,
  WorkspaceRequest,
} from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';
import { usersIpfsRepository } from '../../users/infrastructure/users-ipfs.repository';

class WorkspacesIpfsRepository {
  async createWorkspace(workspace: WorkspaceRequest): Promise<WorkspaceCreateResponse> {
    try {
      const workspaceMeta = { ...workspace.meta };
      delete workspaceMeta.creatorName;

      const form = createJsonFormData(
        { ...workspace, meta: workspaceMeta },
        {
          filename: workspace.uuid,
        },
      );
      const metadataQuery = buildMetadataQuery(workspaceMeta, {
        encodeValueKeys: ['name'],
      });

      const result = await clusterClient.post(
        `/add?stream-channels=false&name=${workspace.uuid}${metadataQuery}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        },
      );

      const data = result.data[0];
      return { cid: data.cid, uuid: data.name };
    } catch (error) {
      logger.error('Error creating workspace:', error);
      throw error;
    }
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (await pinSvcClient.get('/pins?limit=1000&meta={"type":"workspace"}')).data;

      return await this.#enrichWorkspaces(
        pinRes.results.sort((a, b) => a.pin.meta.name.localeCompare(b.pin.meta.name)),
      );
    } catch (error) {
      logger.error(`Error getting workspace pins: ${JSON.stringify(error)}`);
      return [];
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"workspace","workspace_uuid":"${workspaceId}"}`)
      ).data;

      return await this.#enrichWorkspaces(pinRes.results);
    } catch (error) {
      logger.error(`Error getting workspace by ID ${workspaceId}:`, error);
      throw error;
    }
  }

  async getWorkspaceByName(name: string): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"workspace","name":"${encodeURIComponent(name)}"}`)
      ).data;

      return await this.#enrichWorkspaces(pinRes.results);
    } catch (error) {
      logger.error(`Error getting workspace by name ${name}:`, error);
      throw error;
    }
  }

  async getPublicWorkspaces(): Promise<Workspace[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"type":"workspace","is_public":"true"}`)
      ).data;

      return await this.#enrichWorkspaces(pinRes.results);
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
        meta: {
          ...workspace[0].meta,
          is_public: isPublic,
          type: 'workspace',
        },
      };

      await this.createWorkspace(pinRequest);
      await clusterClient.delete(`/pins/${workspace[0].cid}`);
    } catch (error) {
      logger.error(`Error updating workspace type for ${workspaceId}:`, error);
      throw error;
    }
  }

  async getEverythingInWorkspace(workspaceId: string): Promise<GeneralTemplateOfItemInWorkspace[]> {
    try {
      const pinRes: PinningResponse = (
        await pinSvcClient.get(`/pins?limit=1000&meta={"workspaceOrigin":"${workspaceId}"}`)
      ).data;

      return pinRes.results.map((pinRequest: PinRequest) => transformPinToGeneralWorkspaceItem(pinRequest.pin));
    } catch (error) {
      logger.error(`Error getting everything in workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  async deleteWorkspacePin(workspaceCid: string): Promise<void> {
    try {
      await clusterClient.delete(`/pins/${assertAndEncodeURIComponent(workspaceCid)}`);
    } catch (error) {
      logger.error(`Error deleting workspace pin ${workspaceCid}:`, error);
      throw error;
    }
  }

  async #enrichWorkspaces(pinRequests: PinRequest[]): Promise<Workspace[]> {
    return await Promise.all(
      pinRequests.map(async (pinRequest) => {
        const workspace = transformPinToWorkspace(pinRequest.pin);
        const userData = await usersIpfsRepository.getUserData(workspace.meta.creatorNodeId, workspace.meta.creatorUserId);

        return {
          ...workspace,
          meta: {
            ...workspace.meta,
            creatorName: userData.userName,
          },
        };
      }),
    );
  }
}

export const workspacesIpfsRepository = new WorkspacesIpfsRepository();

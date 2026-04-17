import axios from 'axios';

import { IpfsClient } from '../../../shared/clients/ipfs-client';

import { removePermissionsForWorkspace } from '../../../shared/handlers/userPermissions';
import { WorkspaceNotFoundError } from '../errors/workspace-not-found.error';
import { InternalServerError } from '../../../shared/errors';

export async function deleteWorkspaceById(wCID: string, wUID: string) {
  try {
    await removePermissionsForWorkspace(wUID);
    const client = new IpfsClient();
    await client.deleteWorkspaceById(wCID, wUID);
    return 'Workspace deleted successfully';
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new WorkspaceNotFoundError(wUID, error);
    }
    throw new InternalServerError(`Failed to delete workspace (${wCID} ${wUID})`, error);
  }
}

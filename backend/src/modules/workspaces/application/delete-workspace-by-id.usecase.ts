import axios from 'axios';

import { removePermissionsForWorkspace } from '../../../shared/handlers/userPermissions';
import { deleteDocumentsAndAssociatedItems } from '../../documents/application/delete-documents-and-associated-items.usecase';
import { workspacesIpfsRepository } from '../infrastructure/workspaces-ipfs.repository';
import { WorkspaceNotFoundError } from '../errors/workspace-not-found.error';
import { InternalServerError } from '../../../shared/errors';

export async function deleteWorkspaceById(wCID: string, wUID: string) {
  try {
    await removePermissionsForWorkspace(wUID);
    const workspace = await workspacesIpfsRepository.getWorkspaceById(wUID);

    if (!workspace.length) {
      throw new WorkspaceNotFoundError(wUID);
    }

    const everythingInWorkspace = await workspacesIpfsRepository.getEverythingInWorkspace(wUID);
    await deleteDocumentsAndAssociatedItems(everythingInWorkspace);
    await workspacesIpfsRepository.deleteWorkspacePin(wCID);

    return 'Workspace deleted successfully';
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new WorkspaceNotFoundError(wUID, error);
    }
    throw new InternalServerError(`Failed to delete workspace (${wCID} ${wUID})`, error);
  }
}

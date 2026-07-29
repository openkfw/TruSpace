import { v4 as uuidv4 } from 'uuid';

import { createWorkspacePasswordDb } from '../../../shared/clients/db';
import { config } from '../../../shared/config/config';
import { encrypt, hashPassword } from '../../../shared/encryption';
import { createPermission } from '../../../shared/handlers/userPermissions';
import { setRequestContext } from '../../../shared/logging/request-context';
import { WorkspaceRequest } from '../../../shared/types/interfaces';
import { WorkspaceConflictError } from '../errors/workspace-conflict.error';
import { workspacesIpfsRepository } from '../infrastructure/workspaces-ipfs.repository';

export async function postWorkspace(
  name: string,
  isPublic: boolean,
  workspacePassword: string | undefined,
  creatorNodeId: string,
  creatorUserId: string,
  email: string,
) {
  const workspaces = await workspacesIpfsRepository.getWorkspaceByName(name);

  if (workspaces.length > 0) {
    throw new WorkspaceConflictError(name);
  }

  const workspaceId = uuidv4();
  setRequestContext({ workspaceId });
  const password = workspacePassword || workspaceId;
  const workspacePasswordHash = await hashPassword(password);

  const workspaceReq: WorkspaceRequest = {
    uuid: workspaceId,
    meta: {
      workspace_uuid: workspaceId,
      type: 'workspace',
      creatorNodeId,
      creatorUserId,
      created_at: new Date().toISOString(),
      name,
      password_hash: workspacePasswordHash,
      is_public: isPublic,
    },
  };

  await createPermission({
    workspaceId,
    email,
    role: 'owner',
  });

  await createWorkspacePasswordDb(workspaceId, await encrypt(password, config.masterPassword as string));

  return await workspacesIpfsRepository.createWorkspace(workspaceReq);
}

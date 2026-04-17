import { v4 as uuidv4 } from 'uuid';

import { createWorkspacePasswordDb } from '../../../shared/clients/db';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { config } from '../../../shared/config/config';
import { encrypt, hashPassword } from '../../../shared/encryption';
import { createPermission } from '../../../shared/handlers/userPermissions';
import { WorkspaceRequest } from '../../../shared/types/interfaces';
import { WorkspaceConflictError } from '../errors/workspace-conflict.error';

export async function postWorkspace(
  name: string,
  isPublic: boolean,
  workspacePassword: string | undefined,
  creatorNodeId: string,
  creatorUserId: string,
  email: string,
) {
  const client = new IpfsClient();
  const workspaces = await client.getWorkspaceByName(name);

  if (workspaces.length > 0) {
    throw new WorkspaceConflictError(name);
  }

  const workspaceId = uuidv4();
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

  return await client.createWorkspace(workspaceReq);
}

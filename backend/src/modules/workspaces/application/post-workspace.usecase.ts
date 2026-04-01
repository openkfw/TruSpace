import { v4 as uuidv4 } from 'uuid';

import { createWorkspacePasswordDb } from '../../../shared/clients/db';
import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { config } from '../../../shared/config/config';
import logger from '../../../shared/config/winston';
import { encrypt, hashPassword } from '../../../shared/encryption';
import { createPermission } from '../../../shared/handlers/userPermissions';
import { WorkspaceRequest } from '../../../shared/types/interfaces';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function postWorkspace(
  name: string,
  isPublic: boolean,
  workspacePassword: string | undefined,
  creatorNodeId: string,
  creatorUserId: string,
  email: string,
): Promise<UseCaseResponse> {
  const client = new IpfsClient();
  const workspaces = await client.getWorkspaceByName(name);

  if (workspaces.length > 0) {
    logger.warn(`Could not create workspace. "${name}" already exists.`);
    return {
      statusCode: 409,
      body: {
        errors: 'Name already exists. Please choose a different name.',
      },
    };
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

  const result = await client.createWorkspace(workspaceReq);
  return { body: result };
}

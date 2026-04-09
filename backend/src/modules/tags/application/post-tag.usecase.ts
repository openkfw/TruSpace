import { Response } from 'express';

import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { TagRequest } from '../../../shared/types/interfaces';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';

export async function postTag(
  cid: string,
  tagName: string,
  color: string | undefined,
  workspaceOrigin: string,
  docId: string,
  creatorNodeId: string,
  creatorUserId: string,
  email: string,
  res: Response,
) {
  const tagRequest: TagRequest = {
    meta: {
      type: 'tag',
      workspaceOrigin,
      docId,
      versionCid: cid,
      timestamp: new Date().toISOString(),
      name: encodeURIComponent(tagName),
      color: color ?? '',
      creatorType: 'user',
      creatorNodeId,
      creatorUserId,
    },
  };

  await checkPermissionForWorkspace(email, res, workspaceOrigin);

  return new IpfsClient().createTag(tagRequest);
}

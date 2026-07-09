import { Response } from 'express';

import { TagRequest } from '../../../shared/types/interfaces';
import { checkPermissionForWorkspace } from '../../../shared/utility/permissions';
import { recordEvent } from '../../events/application/record-event.usecase';
import { tagsIpfsRepository } from '../infrastructure/tags-ipfs.repository';

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

  const tagCid = await tagsIpfsRepository.createTag(tagRequest);

  await recordEvent({
    eventType: 'tag',
    eventAction: 'create',
    objectId: tagCid,
    objectName: tagName,
    workspaceOrigin,
    docId,
    versionCid: cid,
    actorType: 'user',
    actorNodeId: creatorNodeId,
    actorUserId: creatorUserId,
  });

  return tagCid;
}

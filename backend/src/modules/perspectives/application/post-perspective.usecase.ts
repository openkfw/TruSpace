import { PerspectiveRequest } from '../../../shared/types/interfaces';
import { recordEvent } from '../../events/application/record-event.usecase';
import { perspectivesIpfsRepository } from '../infrastructure/perspectives-ipfs.repository';

export async function postPerspective(
  perspectiveType: string,
  perspectiveText: string,
  workspaceOrigin: string,
  docId: string,
  cid: string,
  creatorNodeId: string,
  creatorUserId: string,
) {
  const perspectiveRequest: PerspectiveRequest = {
    meta: {
      type: 'perspective',
      perspectiveType,
      workspaceOrigin,
      docId,
      versionCid: cid,
      timestamp: new Date().toISOString(),
      data: perspectiveText,
      creatorType: 'user',
      creatorNodeId,
      creatorUserId,
      prompt: '',
    },
  };

  const perspectiveCid = await perspectivesIpfsRepository.createPerspective(perspectiveRequest);

  await recordEvent({
    eventType: 'perspective',
    eventAction: 'create',
    objectId: perspectiveCid,
    objectName: perspectiveType,
    workspaceOrigin,
    docId,
    versionCid: cid,
    actorType: 'user',
    actorNodeId: creatorNodeId,
    actorUserId: creatorUserId,
  });

  return perspectiveCid;
}

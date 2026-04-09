import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { PerspectiveRequest } from '../../../shared/types/interfaces';

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

  return new IpfsClient().createPerspective(perspectiveRequest);
}

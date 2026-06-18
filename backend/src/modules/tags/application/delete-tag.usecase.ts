import { AuthenticatedRequest } from '../../../shared/types';
import { recordEvent } from '../../events/application/record-event.usecase';
import { tagsIpfsRepository } from '../infrastructure/tags-ipfs.repository';

export async function deleteTag(tagId: string, user?: AuthenticatedRequest['user']) {
  // Capture tag context before the pin is removed so we can still describe the
  // event afterwards ("Tag 'urgent' deleted").
  const tag = await tagsIpfsRepository.findTagByCid(tagId);

  const result = await tagsIpfsRepository.deleteTag(tagId);

  if (tag) {
    await recordEvent({
      eventType: 'tag',
      eventAction: 'delete',
      objectId: tagId,
      objectName: tag.meta.name ? decodeURIComponent(tag.meta.name) : undefined,
      workspaceOrigin: tag.meta.workspaceOrigin,
      docId: tag.meta.docId,
      versionCid: tag.meta.versionCid,
      actorType: 'user',
      actorNodeId: user?.nodeId,
      actorUserId: user?.uiid,
    });
  }

  return { result };
}

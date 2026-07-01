import { v4 as uuidv4 } from 'uuid';

import { sendNotification } from '../../../shared/mailing/notifications';
import { ChatMessageRequest } from '../../../shared/types/interfaces';
import { getUserSettingsByUiid } from '../../../shared/utility/user';
import { documentsIpfsRepository } from '../../documents/infrastructure/documents-ipfs.repository';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function postChat(
  creatorNodeId: string,
  creatorUserId: string,
  data: string,
  cid: string,
  docId: string,
  workspaceOrigin: string,
) {
  /* Create a json document and store it in IPFS */
  const chatReq: ChatMessageRequest = {
    meta: {
      data,
      type: 'chat',
      perspectiveType: 'what is perspectiveType?',
      cid,
      docId,
      workspaceOrigin,
      timestamp: Date.now().toString(),
      // Stable per-message id preserved across edits, used by likes to
      // reference the message independently of its current pin cid.
      chatId: uuidv4(),
      creatorNodeId,
      creatorUserId,
    },
  };

  const result = await chatsIpfsRepository.createMessage(chatReq);
  const docInfo = await documentsIpfsRepository.getDocumentDetailsById(docId);

  docInfo.documentVersions
    .map((version) => version.meta.creatorUserId)
    .reduce((acc: string[], uiid: string) => {
      if (!acc.includes(uiid)) {
        acc.push(uiid);
      }
      return acc;
    }, [])
    .forEach(async (documentCreator: string) => {
      const userSettings = await getUserSettingsByUiid(documentCreator);

      if (userSettings?.notificationSettings?.documentChanged && documentCreator !== creatorUserId) {
        sendNotification(
          userSettings?.email,
          'documentChat',
          `/workspace/${docInfo.meta.workspaceOrigin}/document/${docId}`,
          docInfo.meta.filename,
        );
      }
    });
  return result;
}

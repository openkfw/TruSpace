import { IpfsClient } from '../../../shared/clients/ipfs-client';
import { sendNotification } from '../../../shared/mailing/notifications';
import { ChatMessageRequest } from '../../../shared/types/interfaces';
import { getUserSettingsByUiid } from '../../../shared/utility/user';
import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function postChat(
  creatorNodeId: string,
  creatorUserId: string,
  data: string,
  cid: string,
  docId: string,
  workspaceOrigin: string,
) {
  const client = new IpfsClient();
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
      creatorNodeId,
      creatorUserId,
    },
  };

  const result = await chatsIpfsRepository.createMessage(chatReq);
  const docInfo = await client.getDocumentDetailsById(docId);

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

import { chatsIpfsRepository } from '../infrastructure/chats-ipfs.repository';

export async function getChatsByDocumentId(documentId: string) {
  return await chatsIpfsRepository.getMessagesByDocumentId(documentId);
}

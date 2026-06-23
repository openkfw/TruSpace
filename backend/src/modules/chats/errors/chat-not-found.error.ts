export class ChatNotFoundError extends Error {
  constructor(cid: string) {
    super('Chat message not found: ' + cid);
    this.name = 'ChatNotFoundError';
  }
}

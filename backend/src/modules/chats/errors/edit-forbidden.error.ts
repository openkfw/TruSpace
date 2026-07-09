export class ChatEditForbiddenError extends Error {
  constructor() {
    super('Only the author can edit a chat message');
    this.name = 'ChatEditForbiddenError';
  }
}
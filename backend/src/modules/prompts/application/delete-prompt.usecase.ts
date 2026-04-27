import { deletePromptDb } from '../../../shared/clients/db';
import { InternalServerError } from '../../../shared/errors';
import { PromptNotFoundError } from '../errors/prompt-not-found.error';

export async function deletePrompt(title: string) {
  const result = await deletePromptDb(title);

  if (!result.success) {
    if (result.error === 'PROMPT_NOT_FOUND') {
      throw new PromptNotFoundError(title, result.error);
    }
    throw new InternalServerError('Could not delete prompt', result.error);
  }

  return `Prompt "${title}" deleted successfully.`;
}

import { updatePromptDb } from '../../../shared/clients/db';
import { InternalServerError } from '../../../shared/errors';
import { PromptConflictError } from '../errors/prompt-conflict.error';
import { PromptNotFoundError } from '../errors/prompt-not-found.error';

export async function putPrompt(
  currentTitle: string,
  updateData: { title?: string; prompt?: string; updated_by?: string },
) {
  const result = await updatePromptDb(currentTitle, updateData);

  if (!result.success) {
    if (result.error === 'PROMPT_NOT_FOUND') {
      throw new PromptNotFoundError(currentTitle, result.error);
    }
    if (['DUPLICATE_TITLE', 'SQLITE_CONSTRAINT'].includes(result.error)) {
      throw new PromptConflictError(updateData.title, result.error);
    }
    throw new InternalServerError('Could not update prompt', result.error);
  }

  return `Prompt "${currentTitle}" updated successfully.`;
}

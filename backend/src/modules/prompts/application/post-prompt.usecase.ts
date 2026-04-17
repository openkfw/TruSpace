import { createPromptDb } from '../../../shared/clients/db';
import { InternalServerError } from '../../../shared/errors';
import { PromptConflictError } from '../errors/prompt-conflict.error';

export async function postPrompt(title: string, prompt: string, createdBy?: string) {
  const result = await createPromptDb({
    title,
    prompt,
    created_by: createdBy,
  });

  if (result.error) {
    if (['DUPLICATE_TITLE', 'SQLITE_CONSTRAINT'].includes(result.error)) {
      throw new PromptConflictError(title, result.error);
    }
    throw new InternalServerError('Could not post prompt', result.error);
  }

  return `Prompt "${title}" created successfully.`;
}

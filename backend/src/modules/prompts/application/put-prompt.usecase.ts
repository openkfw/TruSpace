import { updatePromptDb } from '../../../shared/clients/db';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function putPrompt(
  currentTitle: string,
  updateData: { title?: string; prompt?: string; updated_by?: string },
): Promise<UseCaseResponse> {
  const result = await updatePromptDb(currentTitle, updateData);

  if (!result.success) {
    switch (result.error) {
      case 'PROMPT_NOT_FOUND':
        return {
          statusCode: 404,
          body: {
            error: 'PROMPT_NOT_FOUND',
            message: `Prompt with title "${currentTitle}" not found.`,
          },
        };

      case 'DUPLICATE_TITLE':
        return {
          statusCode: 409,
          body: {
            error: 'DUPLICATE_TITLE',
            message: `Cannot update: A prompt with title "${updateData.title}" already exists.`,
          },
        };

      case 'SQLITE_CONSTRAINT':
        return {
          statusCode: 409,
          body: {
            error: 'SQLITE_CONSTRAINT',
            message: 'Database constraint violation. The updated title may already be in use.',
          },
        };

      default:
        return {
          statusCode: 500,
          body: {
            error: 'UNKNOWN_ERROR',
            message: 'Could not update prompt. Please check server logs.',
          },
        };
    }
  }

  return {
    body: {
      success: true,
      message: `Prompt "${currentTitle}" updated successfully.`,
    },
  };
}

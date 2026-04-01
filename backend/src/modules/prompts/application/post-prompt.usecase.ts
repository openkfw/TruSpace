import { createPromptDb } from '../../../shared/clients/db';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function postPrompt(title: string, prompt: string, createdBy?: string): Promise<UseCaseResponse> {
  const result = await createPromptDb({
    title,
    prompt,
    created_by: createdBy,
  });

  if (result.error) {
    switch (result.error) {
      case 'DUPLICATE_TITLE':
        return {
          statusCode: 409,
          body: {
            error: 'DUPLICATE_TITLE',
            message: `A prompt with title "${title}" already exists.`,
          },
        };

      case 'SQLITE_CONSTRAINT':
        return {
          statusCode: 409,
          body: {
            error: 'SQLITE_CONSTRAINT',
            message: 'Database constraint violation. The prompt may already exist.',
          },
        };

      default:
        return {
          statusCode: 500,
          body: {
            error: 'UNKNOWN_ERROR',
            message: 'Could not create prompt. Please check server logs.',
          },
        };
    }
  }

  return {
    statusCode: 201,
    body: {
      success: true,
      message: `Prompt "${title}" created successfully.`,
    },
  };
}

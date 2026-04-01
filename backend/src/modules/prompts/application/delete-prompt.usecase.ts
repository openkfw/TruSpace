import { deletePromptDb } from '../../../shared/clients/db';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function deletePrompt(title: string): Promise<UseCaseResponse> {
  const result = await deletePromptDb(title);

  if (!result) {
    return {
      statusCode: 404,
      body: `Prompt with title "${title}" not found or could not be deleted.`,
    };
  }

  return {
    body: {
      success: true,
      message: `Prompt "${title}" deleted successfully.`,
    },
  };
}

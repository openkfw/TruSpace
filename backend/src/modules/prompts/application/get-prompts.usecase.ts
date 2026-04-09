import { readAllPromptsDb } from '../../../shared/clients/db';
import { UseCaseResponse } from '../../../shared/types/usecase';

export async function getPrompts(): Promise<UseCaseResponse> {
  const result = await readAllPromptsDb();
  return { body: result };
}

import { readAllPromptsDb } from '../../../shared/clients/db';

export async function getPrompts(): Promise<Array<{ title: string; prompt: string }>> {
  return await readAllPromptsDb();
}

import db from "../../config/database";
import logger from "../../config/winston";

export type PromptDbErrorCode =
  | "DUPLICATE_TITLE"
  | "PROMPT_NOT_FOUND"
  | "SQLITE_CONSTRAINT"
  | "UNKNOWN_ERROR";

export type PromptDbResult =
  | { success: true; error?: never }
  | { success: false; error: PromptDbErrorCode };

interface PromptDb {
  id?: number;
  title: string;
  prompt: string;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createPromptDb = async (
  prompt: PromptDb
): Promise<PromptDbResult> => {
  try {
    // Check if a prompt with the same title already exists
    const existingPrompt = await db<PromptDb>("prompts")
      .select("id")
      .where("title", "=", prompt.title)
      .first();

    if (existingPrompt) {
      logger.error(`A prompt with title "${prompt.title}" already exists`);
      return { success: false, error: "DUPLICATE_TITLE" };
    }

    await db<PromptDb>("prompts")
      .insert({
        title: prompt.title,
        prompt: prompt.prompt,
        created_by: prompt.created_by,
        updated_by: prompt.updated_by,
      })
      .returning("id");

    return { success: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT"
    ) {
      logger.error(
        `SQLite constraint error: ${JSON.stringify(error, null, 2)}`
      );
      return { success: false, error: "SQLITE_CONSTRAINT" };
    }

    logger.error(`Error creating prompt: ${JSON.stringify(error, null, 2)}`);
    return { success: false, error: "UNKNOWN_ERROR" };
  }
};

export const readAllPromptsDb = async (): Promise<PromptDb[]> => {
  try {
    const prompts = await db<PromptDb>("prompts").select("title", "prompt");
    return prompts;
  } catch (error) {
    logger.error(
      `Error getting all prompts: ${JSON.stringify(error, null, 2)}`
    );
    return [];
  }
};

export const updatePromptDb = async (
  title: string,
  updatedPrompt: Partial<PromptDb>
): Promise<PromptDbResult> => {
  try {
    // Check if the prompt exists first
    const existingPrompt = await db<PromptDb>("prompts")
      .select("id")
      .where("title", "=", title)
      .first();

    if (!existingPrompt) {
      logger.error(`Prompt with title "${title}" not found`);
      return { success: false, error: "PROMPT_NOT_FOUND" };
    }

    if (updatedPrompt.title && updatedPrompt.title !== title) {
      const titleExists = await db<PromptDb>("prompts")
        .select("id")
        .where("title", "=", updatedPrompt.title)
        .first();

      if (titleExists) {
        logger.error(
          `Cannot update: A prompt with title "${updatedPrompt.title}" already exists`
        );
        return { success: false, error: "DUPLICATE_TITLE" };
      }
    }

    await db<PromptDb>("prompts")
      .where("title", "=", title)
      .update({
        title: updatedPrompt.title || title,
        prompt: updatedPrompt.prompt,
        updated_by: updatedPrompt.updated_by,
        updated_at: new Date(),
      });

    return { success: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT"
    ) {
      logger.error(
        `SQLite constraint error: ${JSON.stringify(error, null, 2)}`
      );
      return { success: false, error: "SQLITE_CONSTRAINT" };
    }

    logger.error(`Error updating prompt: ${JSON.stringify(error, null, 2)}`);
    return { success: false, error: "UNKNOWN_ERROR" };
  }
};

export const deletePromptDb = async (
  title: string
): Promise<PromptDbResult> => {
  try {
    await db<PromptDb>("prompts").delete().where("title", "=", title);
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting prompt`, error);
    return { success: false, error: "UNKNOWN_ERROR" };
  }
};

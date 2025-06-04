import db from "../../config/database";
import logger from "../../config/winston";

interface WorkspacePasswordDb {
  id: number;
  workspace_id: string;
  encrypted_password: Buffer;
  created_at?: Date;
  updated_at?: Date;
}

export const createWorkspacePasswordDb = async (
  workspaceId: string,
  encryptedPassword: Buffer
) => {
  try {
    const result = await db<WorkspacePasswordDb>("workspace_passwords")
      .insert({
        workspace_id: workspaceId,
        encrypted_password: encryptedPassword,
      })
      .returning<number>("id");
    return result;
  } catch (error) {
    logger.error(`Error creating entry for workspace password:`, error);
    return undefined;
  }
};

export const getWorkspacePasswordDb = async (workspaceId: string) => {
  try {
    const result = await db<WorkspacePasswordDb>("workspace_passwords")
      .select()
      .where({ workspace_id: workspaceId })
      .first();
    return result;
  } catch (error) {
    logger.error(`Error finding password for workspace ${workspaceId}:`, error);
    return undefined;
  }
};

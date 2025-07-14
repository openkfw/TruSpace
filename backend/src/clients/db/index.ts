import db from "../../config/database";
import logger from "../../config/winston";
export * from "./jobStatus";
export * from "./prompts";
export * from "./userPermissions";
export * from "./users";
export * from "./workspacePasswords";

const REQUIRED_TABLES = [
  "users",
  "user_permissions",
  "workspace_passwords",
  "job_status",
  "prompts",
  "password_reset_tokens"
];

export const getHealthDb = async () => {
  try {
    // Check  DB connection
    await db.raw("SELECT 1+1 as result");

    const missingTables = [];

    // Check if tables exist
    for (const table of REQUIRED_TABLES) {
      const exists = await db.schema.hasTable(table);
      if (!exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      logger.error(`Missing tables: ${missingTables.join(", ")}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(
      `Database connection error: ${JSON.stringify(error, null, 2)}`
    );
    return false;
  }
};

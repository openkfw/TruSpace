import db from "../../config/database";
import logger from "../../config/winston";

interface UserPermissionDb {
  id: number;
  user_email: string;
  workspace_id: string;
  role: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserPermissionDto {
  workspaceId: string;
  email: string;
  role: string;
  status: string;
}

export const createPermissionDb = async (permission: UserPermissionDto) => {
  try {
    const permissionId = await db<UserPermissionDb>("user_permissions")
      .insert({
        workspace_id: permission.workspaceId,
        user_email: permission.email,
        role: permission.role,
        status: permission.status,
      })
      .returning<number>("id");
    return permissionId;
  } catch (error) {
    logger.error("Error creating permission:", error);
    return undefined;
  }
};

export const findPermissionsByEmailDb = async (email: string) => {
  try {
    const perms = await db<UserPermissionDb>("user_permissions")
      .select("workspace_id")
      .where({ user_email: email });
    return perms;
  } catch (error) {
    logger.error(`Error finding permissions for ${email}:`, error);
    return [];
  }
};

export const findUsersInWorkspaceDb = async (workspaceId: string) => {
  try {
    const users = await db("user_permissions")
      .leftJoin("users", "user_permissions.user_email", "=", "users.email")
      .where("user_permissions.workspace_id", "=", workspaceId)
      .andWhere("user_permissions.status", "=", "active")
      .select(
        "user_permissions.id",
        "user_permissions.user_email as email",
        "users.username as name",
        "user_permissions.workspace_id as workspaceId",
        "user_permissions.role"
      );
    return users;
  } catch (error) {
    logger.error(`Error finding permissions for ${workspaceId}:`, error);
    return [];
  }
};

export const removePermissionDb = async (permissionId: string) => {
  try {
    await db<UserPermissionDb>("user_permissions")
      .delete()
      .where("id", "=", permissionId);
  } catch (error) {
    logger.error(`Error deleting permission`, error);
    return [];
  }
};

export const removePermissionsForWorkspaceDb = async (workspaceId: string) => {
  try {
    await db<UserPermissionDb>("user_permissions")
      .delete()
      .where("workspace_id", "=", workspaceId);
  } catch (error) {
    logger.error(`Error deleting permissions`, error);
    return [];
  }
};

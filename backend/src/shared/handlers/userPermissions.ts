import logger from '../config/winston';
import type { UserPermissionDto } from '../../modules/permissions/domain/permissions.types';
import { permissionsIpfsRepository } from '../../modules/permissions/infrastructure/permissions-ipfs.repository';

export type { UserPermissionDto } from '../../modules/permissions/domain/permissions.types';

export const createPermission = async (permission: UserPermissionDto) => {
  try {
    const permissionId = await permissionsIpfsRepository.create(permission);
    // logger.info(
    //   `Permission created with ID: ${permissionId} for email: ${permission.email} in workspace: ${permission.workspaceId}`,
    // );
    return permissionId;
  } catch (error) {
    logger.error('Error creating permission:', error);
    return undefined;
  }
};

export const findPermissionsByEmail = async (email: string) => {
  try {
    const permissions = await permissionsIpfsRepository.findByKey('email', email);
    // logger.info(`Found ${permissions.length} permissions for email: ${email}`);
    return permissions;
  } catch (error) {
    logger.error(`Error finding permissions for ${email}:`, error);
    return [];
  }
};

export const findUsersInWorkspace = async (workspaceId: string) => {
  try {
    const permissions = await permissionsIpfsRepository.findByKey('workspaceId', workspaceId);
    // logger.info(
    //   `Found ${permissions.length} permissions for workspace: ${workspaceId}`,
    // );
    // TODO convert to users data, for now this works since only email is needed
    // the tricky part will be reading user data from other nodes
    return permissions;
  } catch (error) {
    logger.error(`Error finding users for ${workspaceId}:`, error);
    return [];
  }
};

export const findPermissionById = async (permissionId: string) => {
  try {
    const permissions = await permissionsIpfsRepository.findByKey('id', permissionId);
    // logger.info(
    //   `Found ${permissions.length} permissions for ID: ${permissionId}`,
    // );
    if (permissions.length === 0) {
      return undefined;
    }
    return permissions[0];
  } catch (error) {
    logger.error(`Error finding permission by ID ${permissionId}:`, error);
    return undefined;
  }
};

export const removePermission = async (permissionId: string) => {
  try {
    const result = await permissionsIpfsRepository.delete(permissionId);
    // logger.info(`Permission deleted [${result}] with ID: ${permissionId}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting permission`, error);
    return [];
  }
};

export const removePermissionsForWorkspace = async (workspaceId: string) => {
  try {
    const result = await permissionsIpfsRepository.deleteForWorkspace(workspaceId);
    // logger.info(
    //   `Deleted [${result}] Permissions for workspace: ${workspaceId}`,
    // );
    return result;
  } catch (error) {
    logger.error(`Error deleting permissions`, error);
    return [];
  }
};

export const selectNextOldestPermissionUser = (
  users: UserPermissionDto[],
): UserPermissionDto | undefined => {
  return [...users].sort((a, b) => {
    const aDate = Date.parse(a.created_at ?? "");
    const bDate = Date.parse(b.created_at ?? "");
    const aValue = Number.isNaN(aDate) ? Number.MAX_SAFE_INTEGER : aDate;
    const bValue = Number.isNaN(bDate) ? Number.MAX_SAFE_INTEGER : bDate;
    return aValue - bValue;
  })[0];
};

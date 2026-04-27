import { v4 as uuidv4 } from 'uuid';

import { maxNumberOfFetchedPins } from '../../../shared/infrastructure/ipfs/core/config';
import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { Pin } from '../../../shared/types/interfaces';
import logger from '../../../shared/config/winston';
import { UserPermissionDto } from '../domain/permissions.types';

class PermissionsIpfsRepository {
  async create(permission: UserPermissionDto): Promise<string> {
    try {
      permission.id = permission.id ?? uuidv4();
      permission.created_at = permission.created_at ?? new Date().toISOString();

      const encodedId = encodeURIComponent(permission.id);
      const filename = `permissions/${encodedId}`;
      const form = createJsonFormData(permission, {
        filename,
      });
      const metadataQuery = buildMetadataQuery(permission, {
        encodeAllValues: true,
      });

      await clusterClient.post(`/add?stream-channels=false&name=${filename}&meta-type=permission${metadataQuery}`, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
        maxContentLength: Infinity,
      });

      logger.debug(`created Permission: ${filename}`);
      return permission.id;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  async findByKey(key: string, value: string): Promise<UserPermissionDto[]> {
    try {
      const encodedValue = encodeURIComponent(value);
      const response = await pinSvcClient.get(
        `/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"permission","${key}":"${encodedValue}"}`,
      );

      return (response.data?.results ?? []).map((element: { pin: Pin; created?: string }) => ({
        id: element.pin.meta.id,
        workspaceId: element.pin.meta.workspaceId,
        email: element.pin.meta.email,
        role: element.pin.meta.role,
        status: element.pin.meta.status,
        created_at: element.pin.meta.created_at || element.created,
        updated_at: element.pin.meta.updated_at,
      }));
    } catch (error) {
      logger.error('Error getting permission data:', error);
      return [];
    }
  }

  async delete(permissionId: string): Promise<boolean> {
    const encodedPermissionId = encodeURIComponent(permissionId);
    const filepath = `permissions/${encodedPermissionId}`;

    try {
      const res = await pinSvcClient.get(
        `/pins?limit=1&name=${filepath}&meta={"type":"permission","id":"${permissionId}"}`,
      );
      const pins: Pin[] = (res.data?.results ?? []).map((element: { pin: Pin }) => element.pin);

      if (pins.length !== 1) {
        logger.error(`Error deleting permission ${permissionId}: expected 1 pin, found ${pins.length}`);
        return false;
      }

      await clusterClient.delete(`/pins/${pins[0].cid}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting permission ${permissionId}:`, error);
      return false;
    }
  }

  async deleteForWorkspace(workspaceId: string): Promise<number> {
    const encodedWorkspaceId = encodeURIComponent(workspaceId);

    try {
      const response = await pinSvcClient.get(
        `/pins?limit=${maxNumberOfFetchedPins}&meta={"type":"permission", "workspaceId":"${encodedWorkspaceId}"}`,
      );

      let deletedCount = 0;
      await Promise.all(
        (response.data?.results ?? []).map(async (element: { pin: Pin }) => {
          await clusterClient.delete(`/pins/${element.pin.cid}`);
          deletedCount++;
        }),
      );

      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting permissions for ${workspaceId}:`, error);
      return 0;
    }
  }
}

export const permissionsIpfsRepository = new PermissionsIpfsRepository();

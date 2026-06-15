import { v4 as uuidv4 } from 'uuid';

import { buildMetadataQuery, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient } from '../../../shared/infrastructure/ipfs/core/transport';
import logger from '../../../shared/config/winston';
import { UserPermissionDto } from '../domain/permissions.types';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

async function fetchLocalAllocations(primaryFilter?: { key: string; value: string }): Promise<AllocationPin[]> {
  const res = await clusterClient.get('/allocations?local=true');
  const data = res.data;
  let result: AllocationPin[] = [];
  if (typeof data === 'string') {
    result = data.split('\n').filter((l) => l.trim().length > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((l) => { try { return JSON.parse(l); } catch(_e) { return null; } })
      .filter(Boolean);
  } else if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.allocations)) {
    result = data.allocations;
  }
  if (primaryFilter) {
    result = result.filter((a) => a.metadata && a.metadata[primaryFilter.key] === primaryFilter.value);
  }
  return result;
}

function allocationToPermission(alloc: AllocationPin): UserPermissionDto & { cid: string } {
  const m = alloc.metadata ?? {};
  return {
    id: m.id,
    workspaceId: m.workspaceId,
    email: m.email,
    role: m.role,
    status: m.status,
    created_at: m.created_at,
    updated_at: m.updated_at,
    cid: alloc.cid,
  };
}

class PermissionsIpfsRepository {
  async create(permission: UserPermissionDto): Promise<string> {
    try {
      permission.id = permission.id ?? uuidv4();
      permission.created_at = permission.created_at ?? new Date().toISOString();

      const encodedId = encodeURIComponent(permission.id);
      const filename = `permissions/${encodedId}`;
      const form = createJsonFormData(permission, { filename });
      const metadataQuery = buildMetadataQuery(permission, { encodeAllValues: true });

      await clusterClient.post(
        `/add?stream-channels=false&name=${filename}&meta-type=permission${metadataQuery}`,
        form,
        { headers: { ...form.getHeaders() }, timeout: 30000, maxContentLength: Infinity },
      );

      logger.debug(`created Permission: ${filename}`);
      return permission.id;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  async findByKey(key: string, value: string): Promise<UserPermissionDto[]> {
    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'permission' });
      const filtered = allocations.filter((a) => a.metadata?.[key] === value);
      logger.info(`[permissions.findByKey] key=${key} fetch=${Date.now() - t0}ms, total=${allocations.length} filtered=${filtered.length}`);
      return filtered.map(allocationToPermission);
    } catch (error) {
      logger.error('Error getting permission data:', error);
      return [];
    }
  }

  async delete(permissionId: string): Promise<boolean> {
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'permission' });
      const match = allocations.find((a) => a.metadata?.id === permissionId);

      if (!match) {
        logger.error(`Error deleting permission ${permissionId}: not found`);
        return false;
      }

      await clusterClient.delete(`/pins/${match.cid}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting permission ${permissionId}:`, error);
      return false;
    }
  }

  async deleteForWorkspace(workspaceId: string): Promise<number> {
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'permission' });
      const matches = allocations.filter((a) => a.metadata?.workspaceId === workspaceId);

      await Promise.all(matches.map((a) => clusterClient.delete(`/pins/${a.cid}`)));
      return matches.length;
    } catch (error) {
      logger.error(`Error deleting permissions for ${workspaceId}:`, error);
      return 0;
    }
  }
}

export const permissionsIpfsRepository = new PermissionsIpfsRepository();
import { Response } from 'express';

import logger from '../../../shared/config/winston';
import { createFileFormData, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient, gatewayClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { File, UserData } from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';

type AllocationPin = { cid: string; metadata?: Record<string, string> };

const userDataCache = new Map<string, UserData>();

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

class UsersIpfsRepository {
  async resolveNodeId(explicitNodeId?: string): Promise<string> {
    if (explicitNodeId) return explicitNodeId;
    try {
      const clusterId = await clusterClient.get('/id');
      return clusterId.data?.ipfs?.id || '';
    } catch (error) {
      logger.error('Error resolving nodeId:', error);
      return '';
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    try {
      const form = createFileFormData(file);
      const result = await clusterClient.post('/add?stream-channels=false', form, {
        headers: { ...form.getHeaders() },
        timeout: 30000,
        maxContentLength: Infinity,
      });
      return result.data[0].cid;
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async downloadAvatar(res: Response, cid: string): Promise<void> {
    try {
      const result = await gatewayClient.get('/ipfs/' + encodeURIComponent(cid), { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(result.data);
      const contentType = result.headers['content-type'];
      res.setHeader('Content-Type', typeof contentType === 'string' ? contentType : 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="' + cid + '"');
      res.end(fileBuffer);
    } catch (error) {
      logger.error(error);
      res.status(404);
    }
  }

  async createUserData(userData: UserData): Promise<void> {
    try {
      const form = createJsonFormData(userData, { filename: 'userdata.json' });
      const safeNodeId = encodeURIComponent(userData.nodeId);
      const safeUserId = encodeURIComponent(userData.userId);
      const userDataPath = this.#buildUserDataPath(userData.nodeId, userData.userId);
      await clusterClient.post(
        '/add?stream-channels=false&name=' + encodeURIComponent(userDataPath) +
        '&meta-type=userdata&meta-nodeId=' + safeNodeId + '&meta-userId=' + safeUserId,
        form,
        { headers: { ...form.getHeaders() }, timeout: 30000, maxContentLength: Infinity },
      );
      userDataCache.delete(userData.nodeId + ':' + userData.userId);
    } catch (error) {
      logger.error('Error creating user data:', error);
      throw error;
    }
  }

  async modifyUserData(userData: UserData): Promise<void> {
    try {
      await this.deleteUserData(userData.nodeId, userData.userId);
      await this.createUserData(userData);
    } catch (error) {
      logger.error('Error modifying user data:', error);
      throw error;
    }
  }

  async deleteUserData(nodeId: string, userId: string): Promise<void> {
    try {
      const t0 = Date.now();
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'userdata' });
      const pins = allocations.filter((a) => a.metadata?.nodeId === nodeId && a.metadata?.userId === userId);
      logger.info('[users.deleteUserData] fetch=' + (Date.now() - t0) + 'ms, pins=' + pins.length);
      if (!pins.length) return;
      await Promise.all(pins.map((a) => clusterClient.delete('/pins/' + assertAndEncodeURIComponent(a.cid))));
      userDataCache.delete(nodeId + ':' + userId);
    } catch (error) {
      logger.error('Error deleting user data for nodeId=' + nodeId + ', userId=' + userId + ':', error);
      throw error;
    }
  }

  async getUserData(nodeId: string, userId: string): Promise<UserData> {
    if (!nodeId || !userId) return { nodeId, userId, userName: 'UNKNOWN' };

    const cacheKey = nodeId + ':' + userId;
    if (userDataCache.has(cacheKey)) {
      logger.debug('[users.getUserData] cache hit for ' + cacheKey);
      return userDataCache.get(cacheKey) as UserData;
    }

    const t0 = Date.now();
    try {
      const allocations = await fetchLocalAllocations({ key: 'type', value: 'userdata' });
      const pins = allocations.filter((a) => a.metadata?.nodeId === nodeId && a.metadata?.userId === userId);
      logger.info('[users.getUserData] fetch=' + (Date.now() - t0) + 'ms, pins=' + pins.length + ' for ' + nodeId + ':' + userId);

      if (!pins.length) {
        const unknown: UserData = { nodeId, userId, userName: 'UNKNOWN' };
        userDataCache.set(cacheKey, unknown);
        return unknown;
      }

      const latest = pins[pins.length - 1];
      const t1 = Date.now();
      const safeCid = assertAndEncodeURIComponent(latest.cid);
      const result = await gatewayClient.get('/ipfs/' + safeCid, { responseType: 'arraybuffer' });
      logger.info('[users.getUserData] gateway fetch=' + (Date.now() - t1) + 'ms for ' + nodeId + ':' + userId);

      const parsed = JSON.parse(Buffer.from(result.data).toString('utf-8'));
      const userName = typeof parsed?.userName === 'string' && parsed.userName.trim().length > 0
        ? parsed.userName : 'UNKNOWN';

      const userData: UserData = { nodeId, userId, userName };
      userDataCache.set(cacheKey, userData);
      logger.info('[users.getUserData] total=' + (Date.now() - t0) + 'ms, userName=' + userName + ' (cached)');
      return userData;
    } catch (error) {
      logger.error('Error getting user data for nodeId=' + nodeId + ', userId=' + userId + ':', error);
      return { nodeId, userId, userName: 'UNKNOWN' };
    }
  }

  #buildUserDataPath(nodeId: string, userId: string): string {
    return 'users/' + nodeId + '/' + userId + '/userdata.json';
  }
}

export const usersIpfsRepository = new UsersIpfsRepository();
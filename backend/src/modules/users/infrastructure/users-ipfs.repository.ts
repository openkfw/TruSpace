import { Response } from 'express';

import logger from '../../../shared/config/winston';
import { createFileFormData, createJsonFormData } from '../../../shared/infrastructure/ipfs/core/helpers';
import { clusterClient, gatewayClient, pinSvcClient } from '../../../shared/infrastructure/ipfs/core/transport';
import { PinRequest, PinningResponse } from '../../../shared/types/interfaces';
import { File, UserData } from '../../../shared/types/interfaces/truspace';
import { assertAndEncodeURIComponent } from '../../../shared/utility/validation';

class UsersIpfsRepository {
  async resolveNodeId(explicitNodeId?: string): Promise<string> {
    if (explicitNodeId) {
      return explicitNodeId;
    }

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
        headers: {
          ...form.getHeaders(),
        },
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
      const result = await gatewayClient.get(`/ipfs/${cid}`, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(result.data);

      res.setHeader('Content-Type', result.headers['content-type']);
      res.setHeader('Content-Disposition', `attachment; filename="${cid}"`);

      res.end(fileBuffer);
    } catch (error) {
      logger.error(error);
      res.status(404);
    }
  }

  async createUserData(userData: UserData): Promise<void> {
    try {
      const form = createJsonFormData(userData, {
        filename: 'userdata.json',
      });

      const safeNodeId = encodeURIComponent(userData.nodeId);
      const safeUserId = encodeURIComponent(userData.userId);
      const userDataPath = this.#buildUserDataPath(userData.nodeId, userData.userId);

      await clusterClient.post(
        `/add?stream-channels=false&name=${encodeURIComponent(
          userDataPath,
        )}&meta-type=userdata&meta-nodeId=${safeNodeId}&meta-userId=${safeUserId}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000,
          maxContentLength: Infinity,
        },
      );
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
      const pins = await this.#getUserDataPins(nodeId, userId);
      if (!pins.length) return;

      await Promise.all(
        pins.map((pin) => clusterClient.delete(`/pins/${assertAndEncodeURIComponent(pin.pin.cid)}`)),
      );
    } catch (error) {
      logger.error(`Error deleting user data for nodeId=${nodeId}, userId=${userId}:`, error);
      throw error;
    }
  }

  async getUserData(nodeId: string, userId: string): Promise<UserData> {
    try {
      if (!nodeId || !userId) {
        return { nodeId, userId, userName: 'UNKNOWN' };
      }

      const pins = await this.#getUserDataPins(nodeId, userId);
      if (!pins.length) {
        return { nodeId, userId, userName: 'UNKNOWN' };
      }

      const latestPin = pins.sort(
        (a: PinRequest, b: PinRequest) => Number(new Date(b.created).getTime()) - Number(new Date(a.created).getTime()),
      )[0];

      const safeCid = assertAndEncodeURIComponent(latestPin.pin.cid);
      const result = await gatewayClient.get(`/ipfs/${safeCid}`, {
        responseType: 'arraybuffer',
      });

      const fileBuffer = Buffer.from(result.data);
      const parsed = JSON.parse(fileBuffer.toString('utf-8'));
      const userName =
        typeof parsed?.userName === 'string' && parsed.userName.trim().length > 0 ? parsed.userName : 'UNKNOWN';

      return {
        nodeId,
        userId,
        userName,
      };
    } catch (error) {
      logger.error(`Error getting user data for nodeId=${nodeId}, userId=${userId}:`, error);
      return { nodeId, userId, userName: 'UNKNOWN' };
    }
  }

  #buildUserDataPath(nodeId: string, userId: string): string {
    return `users/${nodeId}/${userId}/userdata.json`;
  }

  async #getUserDataPins(nodeId: string, userId: string): Promise<PinRequest[]> {
    const metaQuery = encodeURIComponent(
      JSON.stringify({
        type: 'userdata',
        nodeId,
        userId,
      }),
    );

    const res = await pinSvcClient.get(`/pins?limit=1000&meta=${metaQuery}`);
    const pins: PinningResponse = res.data;

    return pins.results || [];
  }
}

export const usersIpfsRepository = new UsersIpfsRepository();

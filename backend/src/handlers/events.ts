import { v4 as uuidv4 } from "uuid";
import {
  filterNewEventIdsDb,
  createPermissionDb,
  UserPermissionDto,
  removePermissionsForWorkspaceAndEmailDb,
  createEventDb,
} from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { EventModel, EventPayload, Pin } from "../types/interfaces";
import { EVENT_TYPES } from "../utility/constants";
import logger from "../config/winston";

const client = new IpfsClient();
let cachedIpfsId: string | undefined;

const getIpfsId = async (): Promise<string> => {
  if (cachedIpfsId) return cachedIpfsId;

  const clusterId = await client.clusterId();
  const ipfsId = clusterId.ipfs?.id;
  if (!ipfsId) {
    throw new Error("IPFS node ID is unavailable");
  }

  cachedIpfsId = ipfsId;
  return cachedIpfsId;
};

const eventHandlers: Record<string, (payload: EventPayload) => Promise<void>> =
  {
    [EVENT_TYPES.userPermissionPost]: userPermissionPostEvent,
    [EVENT_TYPES.userInWorkspaceRemove]: userInWorkspaceRemoveEvent,
  };

async function userPermissionPostEvent(payload: EventPayload) {
  await createPermissionDb(payload as UserPermissionDto);
}

async function userInWorkspaceRemoveEvent(payload: EventPayload) {
  await removePermissionsForWorkspaceAndEmailDb(
    payload.workspaceId,
    payload.email,
  );
}

export const EventHandler = {
  generateEventId: async () => `${await getIpfsId()}-${uuidv4()}`,

  createPermissionEvent: async function (
    eventRecievers: string[],
    event: EventModel,
  ) {
    await createEventDb(event);
    await client.createPermissionEvent(eventRecievers, event);
  },

  readUserEvents: async function (email: string) {
    try {
      const permissionPins = await client.getPermissionEventPinsForEmail(email);
      console.log(`permissionPins: ${JSON.stringify(permissionPins, null, 2)}`);
      if (!permissionPins.length) return;

      const eventIds = permissionPins.map((pin: Pin) => pin.meta?.eventId);
      const newEventIds = await filterNewEventIdsDb(eventIds);
      console.log(`newEventIds: ${JSON.stringify(newEventIds, null, 2)}`);
      if (!newEventIds.length) return;

      const newEventPins = permissionPins.filter((pin) =>
        newEventIds.includes(pin.meta.eventId),
      );
      console.log(`newEventPins: ${JSON.stringify(newEventPins, null, 2)}`);
      const newPermissionEvents =
        await client.getPermissionEvents(newEventPins);
      await Promise.all(
        newPermissionEvents.map(async (event) => {
          await eventHandlers[event.type](event.payload);
          await createEventDb(event);
        }),
      );
    } catch (error) {
      logger.error("Error reading user events:", error);
    }
  },
};

import { v4 as uuidv4 } from "uuid";
import {
  filterNewEventIdsDb,
  createPermissionDb,
  removePermissionsForWorkspaceAndEmailDb,
  createEventDb,
  findPermissionsByWorkspaceIdDb,
  UserPermissionDto,
  removePermissionsForWorkspaceDb,
} from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import {
  CreateUserPermissionPostPayload,
  EventModel,
  EventPayload,
  EventType,
  Pin,
  UserInWorkspaceRemovePayload,
} from "../types/interfaces";
import { EVENT_TYPES } from "../utility/constants";
import logger from "../config/winston";

const client = new IpfsClient();

async function generateEventId(): Promise<string> {
  const clusterId = await client.clusterId();
  const ipfsId = clusterId.ipfs?.id;
  if (!ipfsId) throw new Error("IPFS node ID is unavailable");
  return `${ipfsId}-${uuidv4()}`;
}

const eventHandlers: Record<
  EventType,
  (payload: EventPayload) => Promise<void>
> = {
  [EVENT_TYPES.userPermissionPost]: handleUserPermissionPost,
  [EVENT_TYPES.userInWorkspaceRemove]: handleUserInWorkspaceRemove,
  [EVENT_TYPES.removePermissionsForWorkspace]:
    handleRemovePermissionsForWorkspace,
};

async function handleUserPermissionPost(payload: EventPayload) {
  logger.debug("userPermissionPostEvent payload", payload);
  const { workspaceId, workspacePermissions } =
    payload as CreateUserPermissionPostPayload;

  const existingPermissions = await findPermissionsByWorkspaceIdDb(workspaceId);
  const newPermissions = workspacePermissions.filter(
    (permission) =>
      !existingPermissions.find(
        (existing) => existing.email === permission.email,
      ),
  );

  if (newPermissions.length) {
    logger.debug("found new permissions", newPermissions);
    await Promise.all(
      newPermissions.map((permission) => createPermissionDb(permission)),
    );
  }
}

async function handleUserInWorkspaceRemove(payload: EventPayload) {
  logger.debug("userInWorkspaceRemoveEvent payload", payload);
  const { workspaceId, email } = payload as UserInWorkspaceRemovePayload;
  await removePermissionsForWorkspaceAndEmailDb(workspaceId, email);
}

async function handleRemovePermissionsForWorkspace(payload: EventPayload) {
  logger.debug("removePermissionsForWorkspaceEvent payload", payload);
  const { workspaceId } = payload as { workspaceId: string };
  await removePermissionsForWorkspaceDb(workspaceId);
}

async function broadcastEvent(event: EventModel, workspaceId: string) {
  const perms = await findPermissionsByWorkspaceIdDb(workspaceId);
  await Promise.all(
    perms.map((p: UserPermissionDto) =>
      client.createPermissionEvent(event, p.email),
    ),
  );
}

export const EventHandler = {
  generateEventId,

  userPermissionPost: async (workspaceId: string, eventId: string) => {
    const workspacePermissions =
      await findPermissionsByWorkspaceIdDb(workspaceId);

    const event: EventModel = {
      id: eventId,
      type: EVENT_TYPES.userPermissionPost,
      date: new Date(),
      payload: {
        workspaceId,
        workspacePermissions,
      },
    };
    await broadcastEvent(event, workspaceId);
    await createEventDb(event);
  },

  userInWorkspaceRemove: async (workspaceId: string, email: string) => {
    const event: EventModel = {
      id: await generateEventId(),
      type: EVENT_TYPES.userInWorkspaceRemove,
      date: new Date(),
      payload: {
        workspaceId,
        email,
      },
    };
    await broadcastEvent(event, workspaceId);
    await createEventDb(event);
  },

  removePermissionsForWorkspace: async (workspaceId: string) => {
    const event: EventModel = {
      id: await generateEventId(),
      type: EVENT_TYPES.removePermissionsForWorkspace,
      date: new Date(),
      payload: {
        workspaceId,
      },
    };
    await broadcastEvent(event, workspaceId);
    await createEventDb(event);
  },

  readPermissionEvents: async function (email: string) {
    try {
      const permissionPins =
        await client.getPermissionEventPinsForReciever(email);
      logger.debug("permissionPins", permissionPins);
      if (!permissionPins.length) return;

      const eventIds = permissionPins.map((pin: Pin) => pin.meta?.eventId);
      const newEventIds = await filterNewEventIdsDb(eventIds);
      if (!newEventIds.length) return;

      const newEventPins = permissionPins.filter((pin: Pin) =>
        newEventIds.includes(pin.meta.eventId),
      );
      const newPermissionEvents = (
        await client.getPermissionEvents(newEventPins)
      ).sort((a, b) => a.date.getTime() - b.date.getTime());

      for (const event of newPermissionEvents) {
        await eventHandlers[event.type](event.payload);
        await createEventDb(event);
      }
    } catch (error) {
      logger.error("Error reading user events:", error);
    }
  },
};

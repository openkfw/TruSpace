import db from "../../config/database";
import logger from "../../config/winston";
import { EventModel } from "../../types/interfaces";

interface EventDb {
  id: string;
  type: string;
  date: Date;
  payload: JSON;
  created_at?: Date;
}

export const createEventDb = async (event: EventModel) => {
  try {
    const eventId = await db<EventDb>("events")
      .insert({
        id: event.id,
        type: event.type,
        date: event.date,
        payload: event.payload as unknown as JSON,
      })
      .returning<string>("id");
    return eventId;
  } catch (error) {
    logger.error("Error creating event:", error);
    return undefined;
  }
};

export const findEventByIdDb = async (eventId: string) => {
  try {
    const event = await db<EventDb>("events")
      .select("*")
      .where("id", "=", eventId)
      .first();
    return event;
  } catch (error) {
    logger.error(`Error finding event by ID ${eventId}:`, error);
    return undefined;
  }
};

export const filterNewEventIdsDb = async (
  eventIds: string[],
): Promise<string[]> => {
  try {
    if (!eventIds.length) {
      return [];
    }

    const uniqueEventIds = Array.from(
      new Set(
        eventIds.filter(
          (eventId): eventId is string =>
            typeof eventId === "string" && eventId.length > 0,
        ),
      ),
    );
    if (!uniqueEventIds.length) {
      return [];
    }
    const existing = await db<EventDb>("events")
      .select("id")
      .whereIn("id", uniqueEventIds);

    const existingIds = new Set(existing.map((event) => event.id));
    return uniqueEventIds.filter((eventId) => !existingIds.has(eventId));
  } catch (error) {
    logger.error("Error filtering new event IDs:", error);
    return [];
  }
};

export const removeEventDb = async (eventId: string) => {
  try {
    const result = await db<EventDb>("events")
      .delete()
      .where("id", "=", eventId);
    const isRowFoundAndDeleted = result > 0;
    return isRowFoundAndDeleted;
  } catch (error) {
    logger.error(`Error deleting event`, error);
    return false;
  }
};

export const removeEventsForWorkspaceDb = async (workspaceId: string) => {
  try {
    await db<EventDb>("events")
      .delete()
      .whereRaw("json_extract(payload, '$.workspaceId') = ?", [workspaceId]);
  } catch (error) {
    logger.error(`Error deleting events for workspace ${workspaceId}:`, error);
    return [];
  }
};

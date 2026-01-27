import db from "../../config/database";
import logger from "../../config/winston";

interface EventDb {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_event: string;
  payload: JSON;
  created_at?: Date;
}

export interface EventDto {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_event: string;
  payload: JSON;
}

export const createEventDb = async (event: EventDto) => {
  try {
    const eventId = await db<EventDb>("events")
      .insert({
        id: event.id,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        entity_event: event.entity_event,
        payload: event.payload,
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

export const removeEventsForEntityDb = async (
  entity_type: string,
  entity_id: string,
) => {
  try {
    await db<EventDb>("events")
      .delete()
      .where("entity_type", "=", entity_type)
      .andWhere("entity_id", "=", entity_id);
  } catch (error) {
    logger.error(
      `Error deleting events for entity ${entity_type} with ID ${entity_id}`,
      error,
    );
    return [];
  }
};

import { EVENT_TYPES } from "../../utility/constants";
import { UserPermissionDto } from "../../clients/db/userPermissions";

export type EventPayload = UserPermissionDto;
export type EventType =
  | typeof EVENT_TYPES.userPermissionPost
  | typeof EVENT_TYPES.userInWorkspaceRemove;

export interface EventModel {
  id: string;
  type: EventType;
  payload: EventPayload;
  created_at?: Date;
}

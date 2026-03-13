import { EVENT_TYPES } from "../../utility/constants";
import { UserPermissionDto } from "../../clients/db/userPermissions";

export interface UserInWorkspaceRemovePayload {
  workspaceId: string;
  email: string;
}

export interface CreateUserPermissionPostPayload {
  workspaceId: string;
  workspacePermissions: UserPermissionDto[];
}

export interface CreateUserPermissionPostPayload {
  workspaceId: string;
  workspacePermissions: UserPermissionDto[];
}

export interface RemovePermissionsForWorkspacePayload {
  workspaceId: string;
}

export type EventPayload =
  | CreateUserPermissionPostPayload
  | UserInWorkspaceRemovePayload
  | RemovePermissionsForWorkspacePayload;

export type EventType =
  | typeof EVENT_TYPES.userPermissionPost
  | typeof EVENT_TYPES.userInWorkspaceRemove
  | typeof EVENT_TYPES.removePermissionsForWorkspace;

export interface EventModel {
  id: string;
  type: EventType;
  date: Date;
  payload: EventPayload;
  created_at?: Date;
}

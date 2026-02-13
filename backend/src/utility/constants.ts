export const USER_STATUS = {
  active: "active",
  inactive: "inactive",
};

export const USER_PERMISSION_STATUS = {
  active: "active",
  inactive: "inactive",
};

export const EVENT_TYPES = {
  userPermissionPost: "user-permission-post",
  userInWorkspaceRemove: "user-in-workspace-remove",
} as const;

export const CONFIRMATION_EMAIL_EXPIRATION = 1200; // seconds

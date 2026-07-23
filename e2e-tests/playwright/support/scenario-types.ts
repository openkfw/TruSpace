export type WorkspaceVisibility = "public" | "private";
export type ThemeMode = "light" | "dark" | "system";
export type NotificationPreference =
  | "document updates"
  | "workspace invitations"
  | "workspace changes";

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export type ScenarioWorkspace = {
  cid: string;
  deleted?: boolean;
  id: string;
  name: string;
  ownerUserKey: string;
  visibility: WorkspaceVisibility;
};

export type ScenarioState = {
  activeUserKey?: string;
  cleanupUserKeys?: string[];
  createdWorkspaceCid?: string;
  createdWorkspaceId?: string;
  createdWorkspaceName?: string;
  createdWorkspaceVisibility?: WorkspaceVisibility;
  createdWorkspaces?: ScenarioWorkspace[];
  deletedUserKeys?: string[];
  documentDownloadUrl?: string;
  lastAccessDeniedStatus?: number;
  lastAppStatusRefreshSucceeded?: boolean;
  selectedLanguage?: "en" | "de";
  selectedTheme?: ThemeMode;
  updatedDisplayName?: string;
  updatedNotificationPreference?: {
    checked: boolean;
    preference: NotificationPreference;
  };
  uploadedDocumentName?: string;
  users?: Record<string, TestUser>;
  workspaceCountBeforeDuplicateAttempt?: number;
};

export interface UserNotificationSettings {
   addedToWorkspace?: boolean;
   removedFromWorkspace?: boolean;
   documentChanged?: boolean;
   documentChat?: boolean;
   workspaceChange?: boolean;
}

export interface UserSettings {
   preferedLanguage: string;
   notificationSettings?: UserNotificationSettings;
}

export interface User {
   name: string;
   email: string;
   uiid: string;
   avatar?: string;
   settings?: UserSettings;
   firstSignIn: boolean;
   loginTime?: string;
   expires: number;
   initials: string;
}

export interface UserUpdates {
   name?: string;
   email?: string;
   avatar?: string;
   [key: string]: unknown;
}

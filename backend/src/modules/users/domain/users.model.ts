export interface UserModel {
  id?: number;
  username: string;
  email: string;
  status: string;
  uiid: string;
  hash: string;
  userToken: string;
  avatarCid?: string;
  preferedLanguage?: string; // ISO 639-1 code, e.g., "en", "de"
  notificationSettings?: string; // JSON string
  createdAt?: Date;
  updatedAt?: Date;
}

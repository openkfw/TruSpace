export interface UserSchema {
  id: number;
  username: string;
  email: string;
  status: string;
  uiid: string;
  password_hash: string;
  user_token: string;
  avatar_cid?: string;
  prefered_language?: string; // ISO 639-1 code, e.g., "en", "de"
  notification_settings?: string; // JSON string
  created_at?: Date;
  updated_at?: Date;
}

const DEFAULT_API_URL = "http://localhost:8000/api";

export const getApiUrl = (): string => {
   return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
};

export const API_URL = getApiUrl();

export const DOCUMENTS_ENDPOINT = `${API_URL}/documents`;
export const EVENTS_ENDPOINT = `${API_URL}/events`;
export const PERSPECTIVES_ENDPOINT = `${API_URL}/perspectives`;
export const CHATS_ENDPOINT = `${API_URL}/chats`;
export const TAGS_ENDPOINT = `${API_URL}/tags`;
export const WORKSPACES_ENDPOINT = `${API_URL}/workspaces`;
export const USERS_ENDPOINT = `${API_URL}/users`;
export const HEALTH_ENDPOINT = `${API_URL}/health`;
export const PERMISSIONS_ENDPOINT = `${API_URL}/permissions`;
export const LANGUAGE_ENDPOINT = `${API_URL}/language`;

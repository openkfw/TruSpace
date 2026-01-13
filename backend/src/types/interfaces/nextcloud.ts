// NextCloud Integration Types

export interface NextCloudConfig {
  baseUrl: string;
  username: string;
  password: string;
  syncFolder: string;
}

export interface NextCloudFile {
  name: string;
  filename: string;
  type: "file" | "directory";
  size: number;
  lastModified: string;
  etag?: string;
  mime?: string;
}

export interface SyncResult {
  success: boolean;
  pushed: string[];
  pulled: string[];
  errors: string[];
}

export interface UploadRequest {
  filename: string;
  content: string;
  folder?: string;
}

export interface DeleteRequest {
  remotePath: string;
}

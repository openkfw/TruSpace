import { createClient, WebDAVClient, FileStat } from "webdav";
import logger from "../../config/winston";

export interface NextCloudConfig {
  baseUrl: string;
  username: string;
  password: string; // App password recommended
  syncFolder: string; // e.g., "/TruSpace Sync"
}

export interface SyncResult {
  success: boolean;
  uploaded: string[];
  downloaded: string[];
  errors: string[];
}

export class NextCloudClient {
  private client: WebDAVClient;
  private config: NextCloudConfig;

  constructor(config: NextCloudConfig) {
    this.config = config;
    // WebDAV endpoint: /remote.php/dav/files/{username}/
    const webdavUrl = `${config.baseUrl}/remote.php/dav/files/${config.username}`;

    this.client = createClient(webdavUrl, {
      username: config.username,
      password: config.password,
    });
  }

  /**
   * Test connection to NextCloud
   */
  async testConnection(): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.config.syncFolder);
      logger.info(
        `NextCloud connection test: folder "${this.config.syncFolder}" exists: ${exists}`
      );
      return true;
    } catch (error: any) {
      logger.error("NextCloud connection failed:", error.message);
      return false;
    }
  }

  /**
   * List all files in the sync folder
   */
  async listFiles(subPath: string = ""): Promise<FileStat[]> {
    try {
      const path = `${this.config.syncFolder}${subPath}`;
      const contents = (await this.client.getDirectoryContents(
        path
      )) as FileStat[];
      return contents;
    } catch (error: any) {
      logger.error(`Failed to list files in ${subPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Upload a file to NextCloud
   */
  async uploadFile(
    remotePath: string,
    content: Buffer | string,
    contentType?: string
  ): Promise<boolean> {
    try {
      const fullPath = `${this.config.syncFolder}/${remotePath}`.replace(
        /\/+/g,
        "/"
      );
      console.log(contentType); //debug jure

      await this.client.putFileContents(fullPath, content, {
        contentLength: Buffer.isBuffer(content)
          ? content.length
          : Buffer.byteLength(content),
        overwrite: true,
      });

      logger.info(`Uploaded file to NextCloud: ${fullPath}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to upload ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Download a file from NextCloud
   */
  async downloadFile(remotePath: string): Promise<Buffer> {
    try {
      const fullPath = `${this.config.syncFolder}/${remotePath}`.replace(
        /\/+/g,
        "/"
      );
      const content = (await this.client.getFileContents(fullPath)) as Buffer;
      logger.info(`Downloaded file from NextCloud: ${fullPath}`);
      return content;
    } catch (error: any) {
      logger.error(`Failed to download ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a folder in NextCloud
   */
  async createFolder(folderPath: string): Promise<boolean> {
    try {
      const fullPath = `${this.config.syncFolder}/${folderPath}`.replace(
        /\/+/g,
        "/"
      );
      await this.client.createDirectory(fullPath, { recursive: true });
      logger.info(`Created folder in NextCloud: ${fullPath}`);
      return true;
    } catch (error: any) {
      // Ignore if folder already exists
      if (error.status === 405) {
        logger.info(`Folder already exists: ${folderPath}`);
        return true;
      }
      logger.error(`Failed to create folder ${folderPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a file or folder from NextCloud
   */
  async delete(remotePath: string): Promise<boolean> {
    try {
      const fullPath = `${this.config.syncFolder}/${remotePath}`.replace(
        /\/+/g,
        "/"
      );
      await this.client.deleteFile(fullPath);
      logger.info(`Deleted from NextCloud: ${fullPath}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to delete ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(remotePath: string): Promise<boolean> {
    try {
      const fullPath = `${this.config.syncFolder}/${remotePath}`.replace(
        /\/+/g,
        "/"
      );
      return await this.client.exists(fullPath);
    } catch (error: any) {
      logger.error(
        `Failed to check existence of ${remotePath}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Get file stats (size, modified date, etc.)
   */
  async getStats(remotePath: string): Promise<FileStat | null> {
    try {
      const fullPath = `${this.config.syncFolder}/${remotePath}`.replace(
        /\/+/g,
        "/"
      );
      const stat = (await this.client.stat(fullPath)) as FileStat;
      return stat;
    } catch (error: any) {
      logger.error(`Failed to get stats for ${remotePath}:`, error.message);
      return null;
    }
  }
}

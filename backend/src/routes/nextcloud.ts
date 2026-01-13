import express, { Response } from "express";
import { body } from "express-validator";
import { NextCloudClient, NextCloudConfig } from "../clients/nextcloud-client";
import logger from "../config/winston";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";

const router = express.Router();

/**
 * Get NextCloud client instance
 * Uses environment variables only
 */
function getNextCloudClient(): NextCloudClient {
  const ncConfig: NextCloudConfig = {
    baseUrl: process.env.NEXTCLOUD_URL || "",
    username: process.env.NEXTCLOUD_USERNAME || "",
    password: process.env.NEXTCLOUD_PASSWORD || "",
    syncFolder: process.env.NEXTCLOUD_SYNC_FOLDER || "/TruSpace Sync",
  };

  if (!ncConfig.baseUrl || !ncConfig.username || !ncConfig.password) {
    throw new Error(
      "NextCloud configuration is incomplete. Set NEXTCLOUD_URL, NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD"
    );
  }

  return new NextCloudClient(ncConfig);
}

/**
 * GET /api/nextcloud/test
 * Test NextCloud connection
 */
router.get("/test", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = getNextCloudClient();
    const connected = await client.testConnection();

    if (connected) {
      const files = await client.listFiles();
      res.json({
        success: true,
        message: "NextCloud connection successful",
        syncFolder: process.env.NEXTCLOUD_SYNC_FOLDER || "/TruSpace Sync",
        filesInFolder: files.length,
        files: files.map((f) => ({
          name: f.basename,
          type: f.type,
          size: f.size,
          lastModified: f.lastmod,
        })),
      });
    } else {
      res.status(503).json({
        success: false,
        message: "NextCloud connection failed",
      });
    }
  } catch (error: any) {
    logger.error("NextCloud test failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/nextcloud/files
 * List all files in the sync folder
 */
router.get("/files", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subPath = (req.query.path as string) || "";
    const client = getNextCloudClient();
    const files = await client.listFiles(subPath);

    res.json({
      success: true,
      path: subPath || "/",
      files: files.map((f) => ({
        name: f.basename,
        filename: f.filename,
        type: f.type,
        size: f.size,
        lastModified: f.lastmod,
        etag: f.etag,
      })),
    });
  } catch (error: any) {
    logger.error("Failed to list NextCloud files:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/nextcloud/upload
 * Upload a test file to NextCloud
 */
router.post(
  "/upload",
  express.json(),
  validate([
    body("filename").isString().notEmpty().withMessage("Filename is required"),
    body("content").isString().notEmpty().withMessage("Content is required"),
    body("folder").isString().optional(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { filename, content, folder } = req.body;

      const ncClient = getNextCloudClient();
      const remotePath = folder ? `${folder}/${filename}` : filename;

      await ncClient.uploadFile(remotePath, Buffer.from(content, "utf-8"));

      res.json({
        success: true,
        message: `File uploaded to NextCloud: ${remotePath}`,
        details: {
          filename,
          remotePath,
          size: content.length,
        },
      });
    } catch (error: any) {
      logger.error("Failed to upload file to NextCloud:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/nextcloud/download/:filename
 * Download a file from NextCloud
 */
router.get(
  "/download/:filename",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { filename } = req.params;
      const folder = (req.query.folder as string) || "";

      const ncClient = getNextCloudClient();
      const remotePath = folder ? `${folder}/${filename}` : filename;

      const content = await ncClient.downloadFile(remotePath);

      res.json({
        success: true,
        filename,
        remotePath,
        size: content.length,
        content: content.toString("utf-8"),
      });
    } catch (error: any) {
      logger.error("Failed to download file from NextCloud:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/nextcloud/file
 * Delete a file from NextCloud
 */
router.delete(
  "/file",
  express.json(),
  validate([
    body("remotePath")
      .isString()
      .notEmpty()
      .withMessage("Remote path is required"),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { remotePath } = req.body;
      const client = getNextCloudClient();

      await client.delete(remotePath);

      res.json({
        success: true,
        message: `File deleted from NextCloud: ${remotePath}`,
      });
    } catch (error: any) {
      logger.error("Failed to delete file from NextCloud:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;

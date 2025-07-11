import express, { Response } from "express";
import { body } from "express-validator";
import {
  createPermissionDb,
  findUsersInWorkspaceDb,
  removePermissionDb,
} from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { USER_PERMISSION_STATUS } from "../utility/constants";
import { sendNotification } from "../mailing/notifications";

const router = express.Router();

/* POST /api/permissions */
router.post(
  "/",
  express.json(),
  validate([
    body("email").isString().notEmpty(),
    body("workspaceId").isString().notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const email = req.body.email;
    const workspaceId = req.body.workspaceId;

    try {
      const client = new IpfsClient();
      const workspaces = await client.getWorkspaceById(workspaceId);
      if (!workspaces.length) {
        return res.status(400).json({
          status: "failure",
          message: "Adding user to workspace failed, workspace does not exist",
        });
      }
      if (workspaces[0].meta.is_public) {
        return res.status(400).json({
          status: "failure",
          message: "Adding user to workspace failed, workspace is public",
        });
      }
      await createPermissionDb({
        workspaceId,
        email,
        role: "admin",
        status: USER_PERMISSION_STATUS.active,
      });
      // Notify the user about the workspace assignement
      sendNotification(
        email,
        "addedToWorkspace",
        `/workspace/${workspaceId}`,
        workspaces[0].meta.name
      );
      res.json({
        status: "success",
        message: "User added to the workspace",
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        status: "failure",
        message: "Adding user to workspace failed",
      });
    }
  }
);

router.get(
  "/users-in-workspace/:workspaceId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const results = await findUsersInWorkspaceDb(req.params.workspaceId);
      res.json(results);
    } catch (error) {
      console.error("Getting permissions error:", error);
      return res.status(500).json({
        status: "failure",
        message: "Getting workspace permissions failed",
      });
    }
  }
);

router.delete(
  "/users-in-workspace/remove/:permissionId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await removePermissionDb(req.params.permissionId);
      res.json();
    } catch (error) {
      console.error("Removing permissions error:", error);
      return res.status(500).json({
        status: "failure",
        message: "Removing workspace permissions failed",
      });
    }
  }
);

export default router;

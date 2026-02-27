import express, { Response } from "express";
import { body } from "express-validator";
import {
  createPermissionDb,
  findPermissionByIdDb,
  findUsersInWorkspaceDb,
  removePermissionDb,
  UserPermissionDto,
  removeEventDb,
  findEmailsByWorkspaceIdDb,
} from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { USER_PERMISSION_STATUS, EVENT_TYPES } from "../utility/constants";
import { sendNotification } from "../mailing/notifications";
import { EventModel } from "../types/interfaces";
import { EventHandler } from "../handlers/events";

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

      const eventId = await EventHandler.generateEventId();
      const permission: UserPermissionDto = {
        workspaceId,
        email,
        role: "admin",
        status: USER_PERMISSION_STATUS.active,
        lastEventId: eventId,
      };
      const event: EventModel = {
        id: eventId,
        type: EVENT_TYPES.userPermissionPost,
        payload: permission,
      };
      const eventReciever = await findEmailsByWorkspaceIdDb(
        permission.workspaceId,
      );
      let permissionId;
      try {
        permissionId = await createPermissionDb(permission);
        await EventHandler.createPermissionEvent(eventReciever, event);
      } catch (error) {
        console.error("Permission creation error:", error);
        if (permissionId) {
          await removePermissionDb(permissionId.toString());
          await removeEventDb(event.id);
        }
        throw error;
      }

      sendNotification(
        email,
        "addedToWorkspace",
        `/workspace/${workspaceId}`,
        workspaces[0].meta.name,
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
  },
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
  },
);

router.delete(
  "/users-in-workspace/remove/:permissionId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { permissionId } = req.params;
      const permission = await findPermissionByIdDb(permissionId);
      if (!permission) {
        return res.status(404).json({
          status: "failure",
          message: "Permission not found",
        });
      }

      const eventReciever = await findEmailsByWorkspaceIdDb(
        permission.workspace_id,
      );
      const event: EventModel = {
        id: await EventHandler.generateEventId(),
        type: EVENT_TYPES.userInWorkspaceRemove,
        payload: {
          email: permission.user_email,
          workspaceId: permission.workspace_id,
        },
      };
      await EventHandler.createPermissionEvent(eventReciever, event);
      await removePermissionDb(permissionId);

      // TODO We need a ney notification implementation similiar to the events
      // Notify the user about the workspace assignement
      // const workspaces = await client.getWorkspaceById(permission.workspace_id);
      // sendNotification(
      //   permission.user_email,
      //   "removedFromWorkspace",
      //   "/",
      //   workspaces[0].meta.name,
      // );
      res.json();
    } catch (error) {
      console.error("Removing permissions error:", error);
      return res.status(500).json({
        status: "failure",
        message: "Removing workspace permissions failed",
      });
    }
  },
);

export default router;

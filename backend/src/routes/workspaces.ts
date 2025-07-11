import express, { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import axios from "axios";
import { Request } from "express";
import { body, param } from "express-validator";
import {
  createPermissionDb,
  createWorkspacePasswordDb,
  findPermissionsByEmailDb,
  removePermissionsForWorkspaceDb,
} from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { config } from "../config/config";
import logger from "../config/winston";
import { encrypt, hashPassword } from "../encryption";
import { getContributorsWorkspace } from "../handlers/workspaces";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { WorkspaceRequest } from "../types/interfaces/index";
import { USER_PERMISSION_STATUS } from "../utility/constants";

const router = express.Router();

/* GET /api/workspaces */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const allWorkspaces = await new IpfsClient().getAllWorkspaces();
  const allowedWs = (
    await findPermissionsByEmailDb(req.user?.email as string)
  ).map((p) => p.workspace_id);
  const result = allWorkspaces.filter(
    (ws) => allowedWs.includes(ws.uuid) || ws.meta.is_public
  );
  res.json(result);
});

router.get(
  "/contributors/:wId",
  validate([param("wId").isString().notEmpty()]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const wId = req.params.wId as string;
      const result = await getContributorsWorkspace(wId);
      res.json(result);
    } catch (err: any) {
      logger.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch workspace contributors",
      });
    }
  }
);

/* POST /api/workspaces */
router.post(
  "/",
  express.json(),
  validate([
    body("name").isString().notEmpty(),
    body("workspacePassword").isString().isLength({ min: 3 }).optional(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { name, isPublic } = req.body;
    const userPassword = req.body.workspacePassword;
    const isUserPasswordProvided = !!userPassword || false;

    /* Check if workspace with that name doesn't already exist */
    const client = new IpfsClient();
    const workspaces = await client.getWorkspaceByName(name);
    if (workspaces.length > 0) {
      logger.warn(`Could not create workspace. "${name}" already exists.`);
      return res.status(409).json({
        errors: "Name already exists. Please choose a different name.",
      });
    }

    // TODO if workspace password is not provided by the user, generate strong password, using workspace uuid in the meantime
    const workspaceId = uuidv4();
    const password = isUserPasswordProvided ? userPassword : workspaceId;
    const workspacePasswordHash = await hashPassword(password);

    const workspaceReq: WorkspaceRequest = {
      uuid: workspaceId,
      meta: {
        workspace_uuid: workspaceId,
        type: "workspace",
        creator_id: req.user?.uiid as string,
        creator_name: req.user?.name as string,
        created_at: new Date().toISOString(),
        name,
        password_hash: workspacePasswordHash,
        is_public: isPublic,
      },
    };

    // TODO transaction
    await createPermissionDb({
      workspaceId,
      email: req.user?.email as string,
      role: "owner",
      status: USER_PERMISSION_STATUS.active,
    });
    await createWorkspacePasswordDb(
      workspaceId,
      await encrypt(password, config.masterPassword)
    );

    const result = await client.createWorkspace(workspaceReq);
    res.json(result);
  }
);

router.delete("/:wCID/:wUID", async (req: Request, res: Response) => {
  const wCID = req.params.wCID;
  const wUID = req.params.wUID;
  const client = new IpfsClient();
  try {
    await client.deleteWorkspaceById(wCID, wUID);
    await removePermissionsForWorkspaceDb(wUID);
    res.status(200).send({ message: "Workspace deleted successfully" });
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      res.status(404).send({ message: "Workspace not found" });
    } else {
      console.error("Error deleting workspace:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
});

/* PUT /api/workspaces/:wUID */
router.put(
  "/:wUID",
  validate([
    body("isPublic").isBoolean().notEmpty(),
    param("wUID").isString().notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { wUID } = req.params;
    const { isPublic } = req.body;
    const client = new IpfsClient();

    try {
      await client.updateWorkspaceType(wUID, isPublic);
      if (isPublic === false) {
        await createPermissionDb({
          workspaceId: wUID,
          email: req.user?.email as string,
          role: "owner",
          status: USER_PERMISSION_STATUS.active,
        });
      } else {
        await removePermissionsForWorkspaceDb(wUID);
      }
      res.status(200).send({ message: "Workspace updated successfully" });
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.error(error);
        res.status(404).send({ message: "Workspace not found" });
      } else {
        logger.error(error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  }
);

export default router;

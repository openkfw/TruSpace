import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import { IpfsClient } from "../clients/ipfs-client";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { TagRequest } from "../types/interfaces";
import taskQueue from "../utility/jobQueue";
import { checkPermissionForWorkspace } from "../utility/permissions";

const router = express.Router();

router.get(
  "/status/:requestId",
  validate([param("requestId").notEmpty()]),
  async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const job = await taskQueue.getJobStatus(requestId);

    if (!job?.status) {
      return res.status(200).json(null);
    }

    return res.json({
      status: job?.status,
      jobsBefore: job?.jobsBefore,
      timestamp: job?.timestamp,
    });
  }
);

router.post(
  "/version/:cid",
  validate([
    param("cid").notEmpty(),
    body("name").notEmpty(),
    body("color").optional({ nullable: true }),
    body("workspaceOrigin").notEmpty(),
    body("docId").isUUID(4),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const cid = req.params.cid;
    const tagName = req.body.name;
    const color = req.body.color;
    const workspaceOrigin = req.body.workspaceOrigin;
    const docId = req.body.docId;
    const name = req.user?.name as string;

    const client = new IpfsClient();
    const tagRequest: TagRequest = {
      meta: {
        type: "tag",
        workspaceOrigin: workspaceOrigin,
        docId: docId,
        versionCid: cid,
        timestamp: new Date().toISOString(),
        name: encodeURIComponent(tagName),
        color: color,
        creatorType: "user",
        creator: name,
      },
    };
    await checkPermissionForWorkspace(req, res, workspaceOrigin);
    const result = await client.createTag(tagRequest);
    res.json(result);
  }
);

router.delete(
  "/:tagId",
  validate([param("tagId").notEmpty()]),
  async (req: Request, res: Response) => {
    const tagId = req.params.tagId;
    const client = new IpfsClient();
    const result = await client.deleteTag(tagId);
    res.json({ result });
  }
);

router.get(
  "/version/:cid",
  validate([param("cid").notEmpty()]),
  async (req: Request, res: Response) => {
    const cid = req.params.cid;
    const client = new IpfsClient();
    const result = await client.getTagsByVersionCid(cid);
    res.json(result);
  }
);

router.get(
  "/:documentId",
  validate([param("documentId").notEmpty()]),
  async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const client = new IpfsClient();
    const result = await client.getTagsByDocumentId(documentId);
    res.json(result);
  }
);

export default router;

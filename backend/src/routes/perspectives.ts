import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import { IpfsClient } from "../clients/ipfs-client";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { PerspectiveRequest } from "../types/interfaces";
import taskQueue from "../utility/jobQueue";

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

router.get(
  "/version/:cid",
  validate([param("cid").notEmpty()]),
  async (req: Request, res: Response) => {
    const cid = req.params.cid;
    const client = new IpfsClient();
    const result = await client.getPerspectivesByVersionCid(cid);
    res.json(result);
  }
);

router.get(
  "/:documentId",
  validate([param("documentId").isUUID(4)]),
  async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const client = new IpfsClient();
    const result = await client.getPerspectivesByDocumentId(documentId);
    res.json(result);
  }
);

router.get("/", async (_req: Request, res: Response) => {
  const client = new IpfsClient();
  const result = await client.getAllPerspectives();
  res.json(result);
});

router.post(
  "/",
  validate([
    body("perspectiveType").isString().notEmpty(),
    body("perspectiveText").isString().notEmpty(),
    body("workspaceOrigin").isUUID(4).notEmpty(),
    body("docId").isUUID(4).notEmpty(),
    body("cid").isString().notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const client = new IpfsClient();
    const perspectiveRequest: PerspectiveRequest = {
      meta: {
        type: "perspective",
        perspectiveType: req.body.perspectiveType,
        workspaceOrigin: req.body.workspaceOrigin,
        docId: req.body.docId,
        versionCid: req.body.cid,
        timestamp: new Date().toISOString(),
        data: req.body.perspectiveText as string,
        creatorType: "user",
        creator: req.user?.name as string,
        creatorUiid: req.user?.uiid as string,
        prompt: "",
      },
    };
    const result = await client.createPerspective(perspectiveRequest);
    res.json(result);
  }
);

router.post(
  "/generate-custom",
  validate([
    body("promptTitle").isString().notEmpty(),
    body("prompt").isString().notEmpty(),
    body("workspaceOrigin").isUUID(4).notEmpty(),
    body("docId").isUUID(4).notEmpty(),
    body("cid").isString().notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { cid, prompt, promptTitle } = req.body;
    const customSummaryTaskId = await taskQueue.addJob({
      templateId: "perspectives",
      cid,
      prompts: [{ title: promptTitle, prompt: prompt }],
      identifier: uuidv4(),
    });

    const customPromptInitialResponse = {
      requestId: `${customSummaryTaskId}`,
      message: "Request accepted. Processing started for task.",
      statusEndpoint: `/api/perspectives/status/${customSummaryTaskId}`,
    };

    const result = customPromptInitialResponse;
    res.json(result);
  }
);

export default router;

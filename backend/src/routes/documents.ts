import express, { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { body, param, query } from "express-validator";
import { findPermissionsByEmailDb } from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { oiClient } from "../clients/oi-client";
import logger from "../config/winston";
import { encrypt } from "../encryption";
import {
  createDocumentRequest,
  decodeFilename,
  getContributorsDocument,
  getWorkspacePassword,
} from "../handlers/documents";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { Prompt } from "../types/interfaces";
import { Document } from "../types/interfaces/truspace";
import TaskQueue from "../utility/jobQueue";
import {
  addLanguageDetectionTemplate,
  addPerspectivesTemplate,
  addTagsTemplate,
} from "../utility/jobTemplates";
import { checkPermissionForWorkspace } from "../utility/permissions";
import {
  examplePrompts,
  languagePrompt,
  mergePromptArrays,
  readExternalPrompts,
  tagsPrompt,
} from "../utility/prompts";
import { sendNotification } from "../mailing/notifications";
import { getUserSettingsByUiid } from "../utility/user";

(function () {
  addPerspectivesTemplate();
  addTagsTemplate();
  addLanguageDetectionTemplate();
})();

const router = express.Router();

/* GET documents by workspace ID */
router.get(
  "/",
  validate([
    query("workspace").isUUID(4).optional(),
    query("from").isInt().optional(),
    query("limit").isInt().optional(),
    query("search").isString().optional(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const workspace = req.query.workspace as string;
    const from = parseInt(req.query.from as string) || 0;
    const limit = parseInt(req.query.limit as string) || 2;
    const searchString = req.query.search as string;
    const client = new IpfsClient();
    const publicWorkspaces = await client.getPublicWorkspaces();

    if (!workspace || workspace === "undefined") {
      const { data: documents } = await client.getAllDocuments();
      const allowedWs = (
        await findPermissionsByEmailDb(req.user?.email as string)
      ).map((p) => p.workspace_id);
      const result = documents.filter(
        (d) =>
          (allowedWs.includes(d.meta.workspaceOrigin) ||
            publicWorkspaces.some(
              (ws) => ws.meta.workspace_uuid === d.meta.workspaceOrigin
            )) &&
          (searchString && searchString.length > 0
            ? d.meta.filename.toLowerCase().includes(searchString.toLowerCase())
            : true)
      );

      const paginatedResult = result.slice(from, from + limit);
      res.json({
        count: result.length,
        from,
        limit,
        data: paginatedResult,
      });
    } else {
      await checkPermissionForWorkspace(
        req.user?.email as string,
        res,
        workspace
      );

      const { data: documents, count } = await client.getDocumentsByWorkspace(
        workspace as string,
        from,
        limit,
        searchString
      );
      const documentsWithDetails = await Promise.all(
        documents.map(async (doc: Document) => {
          const chats = await client.getMessagesByDocumentId(doc.docId);
          const documentVersions = (
            await client.getDocumentDetailsById(doc.docId)
          ).documentVersions as Document[];
          const docContributors = await getContributorsDocument(doc.docId);
          return {
            ...doc,
            chatsLength: chats.length,
            uniqueContributorsLength: docContributors.count,
            documentVersionsLength: documentVersions.length,
          };
        })
      );
      res.json({
        count,
        from,
        limit,
        data: documentsWithDetails,
      });
    }
  }
);

router.get(
  "/detail/:docId",
  validate([param("docId").isUUID(4)]),
  async (req: AuthenticatedRequest, res: Response) => {
    const docId = req.params.docId;
    const client = new IpfsClient();
    const documents = await client.getDocumentDetailsById(docId);
    await checkPermissionForWorkspace(
      req.user?.email as string,
      res,
      documents.meta.workspaceOrigin
    );

    const result = documents;
    res.json(result);
  }
);

router.get(
  "/stats/:docId",
  validate([param("docId").isUUID(4)]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { docId } = req.params;
    const client = new IpfsClient();
    const [chats, document] = await Promise.all([
      client.getMessagesByDocumentId(docId),
      client.getDocumentDetailsById(docId),
    ]);

    const documentDetails = document.documentVersions;
    const documentVersions = documentDetails.reduce(
      (acc: string[], version: Document) => {
        if (!acc.includes(version.meta.creatorUiid)) {
          acc.push(version.meta.creatorUiid);
        }
        return acc;
      },
      []
    );

    await checkPermissionForWorkspace(
      req.user?.email as string,
      res,
      document.meta.workspaceOrigin
    );
    res.json({
      chatsLength: chats.length,
      uniqueContributorsLength: documentVersions.length,
    });
  }
);

/* GET file by cid (DOWNLOAD) */
router.get(
  "/version/:cid",
  validate([param("cid").notEmpty()]),
  async (req: Request, res: Response) => {
    const cid = req.params.cid;
    return new IpfsClient().downloadDocumentVersionByCid(req, res, cid);
  }
);

/* GET statistics about documents */
router.get("/statistics", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = new IpfsClient();
    const { data: documents, count } = await client.getAllDocuments();
    const recentlyAddedDocuments = documents.filter(
      (doc) =>
        Number(doc.meta.timestamp) > Date.now() - 10 * 24 * 60 * 60 * 1000
    );
    res.json({
      totalDocuments: count,
      recentlyAddedDocuments: recentlyAddedDocuments.length,
    });
  } catch (err: any) {
    logger.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch document statistics",
    });
  }
});

/* POST file */
router.post(
  "/",
  validate([body("workspace").isString().notEmpty()]),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded",
      });
    }
    try {
      const { workspace } = req.body;
      const email = req.user?.email as string;
      const userName = req.user?.name as string;
      const userUiid = req.user?.uiid as string;

      await checkPermissionForWorkspace(email, res, workspace);

      const file = req.files.file as UploadedFile;
      const filename = decodeFilename(file.name);

      const docRequest = createDocumentRequest({
        filename,
        creator: userName,
        creatorUiid: userUiid,
        workspaceOrigin: workspace,
        size: file.size,
        mimetype: file.mimetype,
      });

      const fileDataClone = Buffer.from(file.data);

      const workspacePassword = await getWorkspacePassword(workspace);
      file.data = await encrypt(file.data, workspacePassword);

      const client = new IpfsClient();
      const ipfsClusterResponse = await client.createDocument(docRequest, file);
      const cid = ipfsClusterResponse.cid;

      // ollama obviously needs unencrypted document
      file.data = fileDataClone;

      // process file with AI if it is a PDF or DOCX
      let fileProcessableWithAI = false;
      const fileExtension = filename.split(".").pop();
      if (fileExtension === "pdf" || fileExtension === "docx") {
        fileProcessableWithAI = true;
      }

      let summariesTaskId: string | null = null;
      let tagsTaskId: string | null = null;
      let languageTaskId: string | null = null;
      if (fileProcessableWithAI) {
        const fileData = await oiClient.uploadFile(file);

        if (!fileData || "error" in fileData) {
          throw new Error("Failed to upload file to Ollama");
        }

        const externalPrompts = readExternalPrompts();
        const summaryPrompts: Prompt[] = mergePromptArrays(
          externalPrompts,
          examplePrompts
        );

        summariesTaskId = await TaskQueue.addJob({
          templateId: "perspectives",
          cid,
          prompts: summaryPrompts,
        });

        tagsTaskId = await TaskQueue.addJob({
          templateId: "tags",
          cid,
          prompts: [tagsPrompt],
        });

        languageTaskId = await TaskQueue.addJob({
          templateId: "language",
          cid,
          prompts: [languagePrompt],
        });
      }

      const {
        summariesInitialResponse,
        tagsInitialResponse,
        languageInitialResponse,
      } = fileProcessableWithAI
        ? {
            summariesInitialResponse: {
              requestId: `${summariesTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/perspectives/status/${summariesTaskId}`,
            },
            tagsInitialResponse: {
              requestId: `${tagsTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/perspectives/status/${tagsTaskId}`,
            },
            languageInitialResponse: {
              requestId: `${languageTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/language/status/${languageTaskId}`,
            },
          }
        : {
            summariesInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
            tagsInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
            languageInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
          };

      const responseMessage = "Document uploaded successfully";

      res.json({
        success: true,
        message: responseMessage,
        data: {
          name: encodeURIComponent(file.name),
          size: file.size,
          cid: cid,
          perspectivesStatus: summariesInitialResponse,
          tagsStatus: tagsInitialResponse,
          languageStatus: languageInitialResponse,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

router.put(
  "/:docId",
  validate([
    param("docId").isUUID(4),
    body("workspace").isString().notEmpty(),
    body("versionTagName").isString().isLength({ max: 50 }),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded",
      });
    }

    try {
      const { workspace, versionTagName } = req.body;
      const { docId } = req.params;
      const email = req.user?.email as string;
      const userName = req.user?.name as string;
      const userUiid = req.user?.uiid as string;

      await checkPermissionForWorkspace(email, res, workspace);

      const file = req.files.file as UploadedFile;
      const filename = decodeFilename(file.name);

      const client = new IpfsClient();
      const docInfo = await client.getDocumentDetailsById(docId);
      const latestVersion = docInfo.documentVersions[0].meta.version;

      const docRequest = createDocumentRequest({
        filename,
        version: (parseInt(latestVersion) + 1).toString(),
        creator: userName,
        creatorUiid: userUiid,
        size: file.size,
        mimetype: file.mimetype,
        workspaceOrigin: workspace,
        docId,
        versionTagName,
      });
      const fileDataClone = Buffer.from(file.data); // => clone unencrypted file for LLM processing

      const workspacePassword = await getWorkspacePassword(workspace);
      file.data = await encrypt(file.data, workspacePassword);

      // store encrypted document. cid is derived from this encrypted version
      const ipfsClusterResponse = await client.createDocument(docRequest, file);
      const cid = ipfsClusterResponse.cid;

      file.data = fileDataClone;

      // process file with AI if it is a PDF or DOCX
      let fileProcessableWithAI = false;
      const fileExtension = filename.split(".").pop();
      if (fileExtension === "pdf" || fileExtension === "docx") {
        fileProcessableWithAI = true;
      }

      let summariesTaskId: string | null = null;
      let tagsTaskId: string | null = null;
      let languageTaskId: string | null = null;
      if (fileProcessableWithAI) {
        const fileData = await oiClient.uploadFile(file);

        if (!fileData || "error" in fileData) {
          throw new Error("Failed to upload file to Ollama");
        }

        const externalPrompts = readExternalPrompts();
        const summaryPrompts: Prompt[] = mergePromptArrays(
          externalPrompts,
          examplePrompts
        );

        summariesTaskId = await TaskQueue.addJob({
          templateId: "perspectives",
          cid,
          prompts: summaryPrompts,
        });

        tagsTaskId = await TaskQueue.addJob({
          templateId: "tags",
          cid,
          prompts: [tagsPrompt],
        });

        languageTaskId = await TaskQueue.addJob({
          templateId: "language",
          cid,
          prompts: [languagePrompt],
        });
      }

      const {
        summariesInitialResponse,
        tagsInitialResponse,
        languageInitialResponse,
      } = fileProcessableWithAI
        ? {
            summariesInitialResponse: {
              requestId: `${summariesTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/perspectives/status/${summariesTaskId}`,
            },
            tagsInitialResponse: {
              requestId: `${tagsTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/perspectives/status/${tagsTaskId}`,
            },
            languageInitialResponse: {
              requestId: `${languageTaskId}`,
              message: "Request accepted. Processing started for task.",
              statusEndpoint: `/api/language/status/${languageTaskId}`,
            },
          }
        : {
            summariesInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
            tagsInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
            languageInitialResponse: {
              requestId: null,
              message: "File not processable with AI. No task created.",
              statusEndpoint: null,
            },
          };

      docInfo.documentVersions
        .map((version) => version.meta.creatorUiid)
        .reduce((acc: string[], uiid: string) => {
          if (!acc.includes(uiid)) {
            acc.push(uiid);
          }
          return acc;
        }, [])
        .forEach(async (documentCreator: string) => {
          const userSettings = await getUserSettingsByUiid(documentCreator);

          if (
            userSettings?.notificationSettings?.documentChanged &&
            documentCreator !== req.user?.uiid
          ) {
            sendNotification(
              userSettings?.email,
              "documentChanged",
              `/workspace/${docInfo.meta.workspaceOrigin}/document/${docId}`,
              docInfo.meta.filename
            );
          }
        });

      const responseMessage =
        "Document updated successfully and AI processing initiated where applicable.";

      res.json({
        success: true,
        message: responseMessage,
        data: {
          name: encodeURIComponent(file.name),
          cid,
          size: file.size,
          perspectivesStatus: summariesInitialResponse,
          tagsStatus: tagsInitialResponse,
          languageStatus: languageInitialResponse,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

router.delete(
  "/:docId",
  validate([param("docId").isUUID(4)]),
  async (req: AuthenticatedRequest, res: Response) => {
    const docId = req.params.docId;
    const client = new IpfsClient();

    const doc = await client.getDocumentDetailsById(docId);
    await checkPermissionForWorkspace(
      req.user?.email as string,
      res,
      doc.meta.workspaceOrigin
    );

    const result = await client.deleteDocument(docId);
    res.json({ result });
  }
);

export default router;

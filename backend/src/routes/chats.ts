import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import PDFDocument from "pdfkit";

import { IpfsClient } from "../clients/ipfs-client";
import validate from "../middlewares/validate";
import { AuthenticatedRequest } from "../types";
import { ChatMessageRequest } from "../types/interfaces";

const router = express.Router();
const client = new IpfsClient();

// export messages to PDF
router.get("/export/:docId", async (req: Request, res: Response) => {
  const { docId } = req.params;
  const document = await client.getDocumentDetailsById(docId);
  const result = await client.getMessagesByDocumentId(docId);

  const doc = new PDFDocument();
  doc.pipe(res);
  doc
    .fontSize(25)
    .text(`Chat Messages for document "${document?.meta?.filename}`);
  doc.fontSize(15).text(`Document ID ${docId}`);
  doc.fontSize(15).text(`Creator: ${document?.meta?.creator}`);
  const formattedDate = new Date().toLocaleString();
  doc.fontSize(15).text(`Created at: ${formattedDate}`).moveDown();
  doc.fontSize(15).text(" ");

  result.forEach((message) => {
    let messageText;
    try {
      messageText = JSON.parse(message.meta?.data).message;
    } catch (e) {
      console.error("Error parsing message data", e);
      messageText = message.meta?.data;
    }

    doc.fontSize(13).text(`Message: ${messageText}`);
    doc.fontSize(10).text(`Author: ${message.meta.creator}`);
    const formattedDate = new Date(
      Number(message.meta.timestamp)
    ).toLocaleString();
    doc.fontSize(10).text(`Timestamp: ${formattedDate}`);
    doc.moveDown();
  });

  doc.end();
});

/* GET chat messages by document ID */
router.get(
  "/:docId",
  validate([param("docId").isUUID(4)]),
  async (req: Request, res: Response) => {
    const { docId } = req.params;
    const result = await client.getMessagesByDocumentId(docId);
    res.json(result);
  }
);

router.post(
  "/",
  validate([
    body("cid").notEmpty(),
    body("docId").isUUID(4),
    body("workspaceOrigin").isUUID(4),
    body("data").notEmpty(),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { data, cid, docId, workspaceOrigin } = req.body;

    /* Create a json document and store it in IPFS */
    const chatReq: ChatMessageRequest = {
      meta: {
        data,
        type: "chat",
        perspectiveType: "what is perspectiveType?",
        cid,
        docId,
        workspaceOrigin,
        timestamp: Date.now().toString(),
        creator: req.user?.name as string,
        creatorUiid: req.user?.uiid as string,
      },
    };

    const result = await client.createMessage(chatReq);
    res.json(result);
  }
);

export default router;

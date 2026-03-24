import { Request, Response, Router } from "express";
import { UploadedFile } from "express-fileupload";
import { param } from "express-validator";
import { IpfsClient } from "../clients/ipfs-client";
import { oiClient } from "../clients/oi-client";
import validate from "../middlewares/validate";
import taskQueue from "../utility/jobQueue";

const router = Router();

router.post("/", async (req, res) => {
  const file = req.files?.file as UploadedFile;
  const document = req.body.document;
  const fileData = await oiClient.uploadFile(file);

  if (!fileData || "error" in fileData) {
    return res
      .status(400)
      .json({ error: fileData?.error || "File upload failed" });
  }

  const result = await oiClient.dispatchDetectLanguage(document, fileData);
  res.json(result);
});

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
  "/:documentId",
  validate([param("documentId").notEmpty()]),

  async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const ipfsClient = new IpfsClient();
    const result = await ipfsClient.getDocumentVersionDetailsByCid(documentId);

    if (!result || "error" in result) {
      return res
        .status(400)
        .json({ error: result?.error || "File retrieval failed" });
    }

    res.json(result.meta.language);
  }
);

export default router;

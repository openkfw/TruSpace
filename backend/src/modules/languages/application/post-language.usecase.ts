import { Response } from "express";
import { UploadedFile } from "express-fileupload";

import { oiClient } from "../../../shared/clients/oi-client";
import { Document } from "../../../shared/types/interfaces";

export async function postLanguage(file: UploadedFile, document: Document, res: Response) {
  const fileData = await oiClient.uploadFile(file);

  if (!fileData || "error" in fileData) {
    return res
      .status(400)
      .json({ error: fileData?.error || "File upload failed" });
  }

  const result = await oiClient.dispatchDetectLanguage(document, fileData);
  return result;
}
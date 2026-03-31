
import { Response } from "express";
import { IpfsClient } from "../../../shared/clients/ipfs-client";

export async function getLanguageByDocumentId(documentId: string, res: Response) {
  const ipfsClient = new IpfsClient();
    const result = await ipfsClient.getDocumentVersionDetailsByCid(documentId);

  if (!result || "error" in result) {
    return res
      .status(400)
      .json({ error: result?.error || "File retrieval failed" });
  }

  return result.meta.language;
}
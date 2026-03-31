import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";

import { postLanguage } from "../application/post-language.usecase";
import { getLanguageStatus } from "../application/get-language-status.usecase";
import { getLanguageByDocumentId } from "../application/get-language-by-document-id.usecase";


export const LanguagesController = {

  postLanguage: async (req: Request, res: Response) => {
    const file = req.files?.file as UploadedFile;
    const document = req.body.document;
    const result = await postLanguage(file, document, res);
    res.json(result);
  },

  getLanguageStatus: async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const result = await getLanguageStatus(requestId, res);
    res.json(result);
  },

  getLanguageByDocumentId: async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const result = await getLanguageByDocumentId(documentId, res);
    res.json(result);
  }
}

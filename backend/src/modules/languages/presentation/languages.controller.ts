import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';

import { postLanguage } from '../application/post-language.usecase';
import { getLanguageStatus } from '../application/get-language-status.usecase';
import { getLanguageByDocumentId } from '../application/get-language-by-document-id.usecase';

export const LanguagesController = {
  postLanguage: async (req: Request, res: Response) => {
    const result = await postLanguage(req.files?.file as UploadedFile, req.body.document);
    res.json(result);
  },

  getLanguageStatus: async (req: Request, res: Response) => {
    const result = await getLanguageStatus(req.params.requestId);
    res.json(result);
  },

  getLanguageByDocumentId: async (req: Request, res: Response) => {
    const result = await getLanguageByDocumentId(req.params.documentId);
    res.json(result);
  },
};

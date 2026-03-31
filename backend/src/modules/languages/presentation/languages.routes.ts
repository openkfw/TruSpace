import { Router } from "express";
import { authenticateCookie } from "../../../shared/middlewares/authenticate";
import { LanguageValidator } from "./languages.validators";
import { LanguagesController } from "./languages.controller";

export const languagesRouter = Router();

languagesRouter.post("/language", authenticateCookie, LanguagesController.postLanguage);

languagesRouter.get(
  "language/status/:requestId",
  authenticateCookie,
  LanguageValidator.getLanguageStatus,
  LanguagesController.getLanguageStatus
);

languagesRouter.get(
  "language/:documentId",
  authenticateCookie,
  LanguageValidator.getLanguageByDocumentId,
  LanguagesController.getLanguageByDocumentId
);
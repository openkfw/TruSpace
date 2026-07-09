import { oiClient } from "../clients/oi-client";
import logger from "../config/winston";
import { createDocumentRequest } from "../handlers/documents";
import { Prompt } from "../types/interfaces";
import { documentsIpfsRepository } from "../../modules/documents/infrastructure/documents-ipfs.repository";

type JobAttributes = { [key: string]: string | number | boolean | Prompt[] };

type JobTemplateRegistrar = {
  addJobTemplate(args: {
    templateId: string;
    job: (attributes: JobAttributes) => Promise<any>;
  }): void;
};

export const addPerspectivesTemplate = (taskQueue: JobTemplateRegistrar) =>
  taskQueue.addJobTemplate({
    templateId: "perspectives",
    job: async (attributes: JobAttributes) => {
      const { cid, prompts, requestId } = attributes as {
        cid: string;
        prompts: Prompt[];
        requestId: string;
      };

      const fileContent = await documentsIpfsRepository.getDocumentVersionContentByCid(cid);
      const fileDetails = await documentsIpfsRepository.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          logger.debug("Temporary file move requested", { path });
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creatorNodeId: fileDetails.meta.creatorNodeId,
        creatorUserId: fileDetails.meta.creatorUserId,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await oiClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        logger.error("Failed to upload file to Ollama", { fileData });
        throw new Error("Failed to upload file to Ollama");
      }

      return await oiClient.dispatchGeneratePerspectives(
        { ...docRequest, cid },
        fileData,
        requestId,
        prompts,
      );
    },
  });

export const addTagsTemplate = (taskQueue: JobTemplateRegistrar) =>
  taskQueue.addJobTemplate({
    templateId: "tags",
    job: async (attributes: JobAttributes) => {
      const { cid, prompts, requestId } = attributes as {
        cid: string;
        prompts: Prompt[];
        requestId: string;
      };
      const fileContent = await documentsIpfsRepository.getDocumentVersionContentByCid(cid);
      const fileDetails = await documentsIpfsRepository.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          logger.debug("Temporary file move requested", { path });
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creatorNodeId: fileDetails.meta.creatorNodeId,
        creatorUserId: fileDetails.meta.creatorUserId,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await oiClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        logger.error("Failed to upload file to Ollama", { fileData });
        throw new Error("Failed to upload file to Ollama");
      }

      return await oiClient.dispatchGenerateTags(
        { ...docRequest, cid },
        fileData,
        requestId,
        prompts,
      );
    },
  });

export const addLanguageDetectionTemplate = (taskQueue: JobTemplateRegistrar) => {
  taskQueue.addJobTemplate({
    templateId: "language",
    job: async (attributes: JobAttributes) => {
      const { cid } = attributes as {
        cid: string;
      };

      const fileContent = await documentsIpfsRepository.getDocumentVersionContentByCid(cid);
      const fileDetails = await documentsIpfsRepository.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          logger.debug("Temporary file move requested", { path });
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creatorNodeId: fileDetails.meta.creatorNodeId,
        creatorUserId: fileDetails.meta.creatorUserId,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await oiClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        logger.error("Failed to upload file to Ollama", { fileData });
        throw new Error("Failed to upload file to Ollama");
      }

      return await oiClient.dispatchDetectLanguage(
        { ...docRequest, cid },
        fileData,
      );
    },
  });
};

let defaultTemplatesRegistered = false;

export const registerDefaultJobTemplates = (taskQueue: JobTemplateRegistrar) => {
  if (defaultTemplatesRegistered) {
    return;
  }

  addPerspectivesTemplate(taskQueue);
  addTagsTemplate(taskQueue);
  addLanguageDetectionTemplate(taskQueue);

  defaultTemplatesRegistered = true;
};

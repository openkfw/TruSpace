import { IpfsClient } from "../clients/ipfs-client";
import { llmClient } from "../clients/llm-client/LlmClientFactory";
import logger from "../config/winston";
import { createDocumentRequest } from "../handlers/documents";
import { Prompt } from "../types/interfaces";
import TaskQueue from "../utility/jobQueue";

export const addPerspectivesTemplate = () =>
  TaskQueue.addJobTemplate({
    templateId: "perspectives",
    job: async (attributes: {
      [key: string]: string | number | boolean | Prompt[];
    }) => {
      const { cid, prompts, requestId } = attributes as {
        cid: string;
        prompts: Prompt[];
        requestId: string;
      };

      const client = new IpfsClient();

      const fileContent = await client.getDocumentVersionContentByCid(cid);
      const fileDetails = await client.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          console.log(path);
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creator: fileDetails.meta.creator,
        creatorUiid: fileDetails.meta.creatorUiid,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await llmClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        logger.error(`Failed to upload file to Ollama:  ${fileData}`);
        throw new Error("Failed to upload file to Ollama");
      }

      return await llmClient.dispatchGeneratePerspectives(
        { ...docRequest, cid },
        fileData,
        requestId,
        prompts
      );
    },
  });

export const addTagsTemplate = () =>
  TaskQueue.addJobTemplate({
    templateId: "tags",
    job: async (attributes: {
      [key: string]: string | number | boolean | Prompt[];
    }) => {
      const { cid, prompts, requestId } = attributes as {
        cid: string;
        prompts: Prompt[];
        requestId: string;
      };
      const client = new IpfsClient();

      const fileContent = await client.getDocumentVersionContentByCid(cid);
      const fileDetails = await client.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          console.log(path);
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creator: fileDetails.meta.creator,
        creatorUiid: fileDetails.meta.creatorUiid,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await llmClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        console.error("Failed to upload file to Ollama", fileData);
        throw new Error("Failed to upload file to Ollama");
      }

      return await llmClient.dispatchGenerateTags(
        { ...docRequest, cid },
        fileData,
        requestId,
        prompts
      );
    },
  });

export const addLanguageDetectionTemplate = () => {
  TaskQueue.addJobTemplate({
    templateId: "language",
    job: async (attributes: {
      [key: string]: string | number | boolean | Prompt[];
    }) => {
      const { cid } = attributes as {
        cid: string;
      };

      const client = new IpfsClient();

      const fileContent = await client.getDocumentVersionContentByCid(cid);
      const fileDetails = await client.getDocumentVersionDetailsByCid(cid);

      const file = {
        name: fileDetails.meta.filename,
        data: fileContent.data,
        size: fileDetails.meta.size || 0,
        mv: async (path: string) => {
          console.log(path);
        },
        encoding: "7bit",
        mimetype: fileDetails.meta.mimetype || "application/octet-stream", // default to binary if not provided
        tempFilePath: "",
        truncated: false,
        md5: "",
      };

      const docRequest = createDocumentRequest({
        filename: fileDetails.meta.filename,
        creator: fileDetails.meta.creator,
        creatorUiid: fileDetails.meta.creatorUiid,
        workspaceOrigin: fileDetails.meta.workspaceOrigin,
        size: fileDetails.meta.size,
      });

      const fileData = await llmClient.uploadFile(file);

      if (!fileData || "error" in fileData) {
        console.error("Failed to upload file to Ollama", fileData);
        throw new Error("Failed to upload file to Ollama");
      }

      return await llmClient.dispatchDetectLanguage(
        { ...docRequest, cid },
        fileData
      );
    },
  });
};

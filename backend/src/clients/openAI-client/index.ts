import OpenAI from "openai";
import { config } from "../../config/config";
import logger from "../../config/winston";
import {
  Document,
  FileData,
  LanguageRequest,
  PerspectiveRequest,
  Prompt,
  TagRequest,
} from "../../types/interfaces";
import { BackendLLMClient } from "../llm-client/llmClientMapping";
import { UploadedFile } from "express-fileupload";
import TaskQueue from "../../utility/jobQueue";
import { languagePrompt } from "../../utility/prompts";
import { IpfsClient } from "../ipfs-client";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export class OpenAICLient implements BackendLLMClient {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openAIApiKey,
    });
  }
  async uploadFile(file: UploadedFile): Promise<FileData | { error: string }> {
    try {
      let content: string = "";
      let effectiveMimeType = file.mimetype;

      if (effectiveMimeType === "application/octet-stream") {
        if (file.name.endsWith(".pdf")) {
          effectiveMimeType = "application/pdf";
        } else if (file.name.endsWith(".docx")) {
          effectiveMimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
      }

      switch (effectiveMimeType) {
        case "application/pdf": {
          const pdfData = await pdf(file.data);
          content = pdfData.text;
          break;
        }
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
          // .docx
          const docxResult = await mammoth.extractRawText({
            buffer: file.data,
          });
          content = docxResult.value;
          break;
        }
        case "text/plain":
        case "text/markdown":
        case "text/csv":
          content = file.data.toString("utf8");
          break;
        default:
          // Log and reject unsupported file types
          logger.warn(
            `Unsupported file type: ${file.mimetype} for file ${file.name}`
          );
          return {
            error: `File type ${file.mimetype} is not supported.`,
          };
      }

      if (content.trim().length === 0 || content.includes("\uFFFD")) {
        logger.warn(
          `File ${file.name} resulted in empty or potentially garbled content after extraction.`
        );

        return {
          error: `Failed to extract readable content from ${file.name}.`,
        };
      }

      const fileData: FileData = {
        id: "",
        user_id: "",
        hash: "",
        filename: file.name,
        data: {
          content: content,
        },
      };

      return fileData;
    } catch (error: any) {
      logger.error(
        `Error processing file in OpenAICLient.uploadFile: ${error.message}`
      );
      return {
        error:
          "Failed to process file content. It may be corrupted or in an unsupported format.",
      };
    }
  }

  async generateCompletion(
    fileData: FileData,
    prompt: string,
    title: string
  ): Promise<{ title: string; summary: string }> {
    try {
      const systemPrompt = `${prompt}\n\nHere is the document content:\n\n${fileData.data.content}`;

      const chatCompletion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes documents.",
          },
          { role: "user", content: systemPrompt },
        ],
        model: "gpt-4.1-mini",
      });

      const summary = chatCompletion.choices[0].message.content ?? "";
      logger.debug(
        `OpenAI chatCompletionResult\n${JSON.stringify(chatCompletion, null, 2).slice(0, 280)}...`
      );

      return { title, summary };
    } catch (error) {
      logger.error(
        `OpenAIClient.generateCompletion failed! ${JSON.stringify(
          error,
          null,
          2
        )}`
      );
      throw error;
    }
  }

  #generateRequestId = (
    cid: string,
    type: "perspectives" | "language" | "tags"
  ): string => {
    return `req_${type}_${cid}`;
  };

  async #detectLanguage({
    requestId,
    document,
    fileData,
    prompt,
  }: {
    requestId: string;
    fileData: FileData;
    document: Document;
    prompt: Prompt;
  }): Promise<void> {
    try {
      const systemPrompt = `${prompt.prompt}\n\nHere is the document content:\n\n${fileData.data.content}`;

      const chatCompletion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that detects the language of a document. Respond with only the name of the language (e.g., 'English', 'German').",
          },
          { role: "user", content: systemPrompt },
        ],
        model: "gpt-4.1-mini",
      });

      const language = chatCompletion.choices[0].message.content?.trim();

      if (!language) {
        throw new Error("Language detection returned an empty result.");
      }

      logger.debug(`Detected language: ${language}`);

      const langRequest: LanguageRequest = {
        meta: {
          type: "language",
          workspaceOrigin: document.meta.workspaceOrigin,
          docId: document.docId,
          versionCid: document.cid,
          timestamp: new Date().toISOString(),
          language: language,
          creatorType: "ai",
        },
      };
      await new IpfsClient().createLanguage(langRequest);

      await TaskQueue.updateJobStatus(requestId, "completed");
    } catch (error) {
      logger.error(`Detecting language failed: ${error}`);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
    }
  }

  async #generateTags({
    requestId,
    document,
    fileData,
    prompt,
  }: {
    requestId: string;
    fileData: FileData;
    document: Document;
    prompt: Prompt;
  }): Promise<void> {
    try {
      const systemPrompt = `${prompt.prompt}\n\nHere is the document content:\n\n${fileData.data.content}`;

      const chatCompletion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates relevant tags for a document. Respond with a comma-separated list of tags (e.g., 'Technology, AI, Programming'). Generate a maximum of 5 tags.",
          },
          { role: "user", content: systemPrompt },
        ],
        model: "gpt-4.1-mini",
      });

      const tagsString = chatCompletion.choices[0].message.content?.trim();
      if (!tagsString) {
        throw new Error("Tag generation returned an empty result.");
      }

      const tags = tagsString.split(",").map((tag) => tag.trim());
      logger.debug(`Generated tags: ${tags.join(", ")}`);

      // store max. 5 tags in IPFS;
      tags.slice(0, 5).forEach(async (tag: string) => {
        const tagRequest: TagRequest = {
          meta: {
            type: "tag",
            workspaceOrigin: document.meta.workspaceOrigin,
            docId: document.docId,
            versionCid: document.cid,
            timestamp: new Date().toISOString(),
            name: tag,
            color: "",
            creator: "OpenAI",
            creatorUiid: "OpenAI",
            creatorType: "ai",
          },
        };
        await new IpfsClient().createTag(tagRequest);
      });

      await TaskQueue.updateJobStatus(requestId, "completed");
    } catch (error) {
      logger.error(`Generating tags failed: ${error}`);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
    }
  }

  async #generatePerspectives({
    requestId,
    document,
    fileData,
    prompts,
  }: {
    requestId: string;
    fileData: FileData;
    document: Document;
    prompts: Prompt[];
  }): Promise<void> {
    try {
      const results = [];
      for (const prompt of prompts) {
        const openAIResponse = await this.generateCompletion(
          fileData,
          prompt.prompt,
          prompt.title
        );

        results.push({
          ...openAIResponse,
          perspectiveType: prompt.title,
          prompt: prompt.prompt,
        });
      }

      for (const result of results) {
        const perspectiveRequest: PerspectiveRequest = {
          meta: {
            type: "perspective",
            perspectiveType: result.perspectiveType,
            workspaceOrigin: document.meta.workspaceOrigin,
            docId: document.docId,
            versionCid: document.cid,
            timestamp: new Date().toISOString(),
            data: result.summary,
            creator: "OpenAI",
            creatorUiid: "OpenAI",
            creatorType: "ai",
            prompt: result.prompt,
            model: "gpt-4.1-mini",
          },
        };
        await new IpfsClient().createPerspective(perspectiveRequest);
      }

      await TaskQueue.updateJobStatus(requestId, "completed");
    } catch (error) {
      logger.error(`Generating perspectives failed: ${error}`);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
    }
  }

  dispatchGeneratePerspectives(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ): Promise<any> {
    if ("error" in fileData) {
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return Promise.resolve({
        requestId,
        message: fileData.error,
        statusEndpoint: `/api/perspectives/status/${requestId}`,
      });
    }

    try {
      TaskQueue.updateJobStatus(requestId, "processing");

      this.#generatePerspectives({
        requestId,
        fileData,
        document,
        prompts,
      });

      return Promise.resolve({
        requestId,
        message: "Request accepted. Processing started.",
        statusEndpoint: `/api/perspectives/status/${requestId}`,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      TaskQueue.updateJobStatus(requestId, "failed", msg);
      return Promise.resolve({
        requestId,
        message: "error",
        statusEndpoint: `/api/perspectives/status/${requestId}`,
      });
    }
  }
  async dispatchGenerateTags(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ): Promise<any> {
    if ("error" in fileData) {
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return {
        requestId,
        message: fileData.error,
        statusEndpoint: `/api/tags/status/${requestId}`,
      };
    }

    try {
      await TaskQueue.updateJobStatus(requestId, "processing");

      this.#generateTags({
        requestId,
        fileData,
        document,
        prompt: prompts[0],
      });

      return {
        requestId,
        message: "Request accepted. Processing started.",
        statusEndpoint: `/api/tags/status/${requestId}`,
      };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await TaskQueue.updateJobStatus(requestId, "failed", msg);
      return {
        requestId,
        message: "error",
        statusEndpoint: `/api/tags/status/${requestId}`,
      };
    }
  }
  async dispatchDetectLanguage(
    document: Document,
    fileData: FileData
  ): Promise<any> {
    const requestId = this.#generateRequestId(document.cid, "language");

    if ("error" in fileData) {
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return {
        requestId,
        message: fileData.error,
        statusEndpoint: `/api/language/status/${requestId}`,
      };
    }

    try {
      await TaskQueue.updateJobStatus(requestId, "processing");

      this.#detectLanguage({
        requestId,
        fileData,
        document,
        prompt: languagePrompt,
      });

      return {
        requestId,
        message: "Request accepted. Processing started.",
        statusEndpoint: `/api/language/status/${requestId}`,
      };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await TaskQueue.updateJobStatus(requestId, "failed", msg);
      return {
        requestId,
        message: "error",
        statusEndpoint: `/api/language/status/${requestId}`,
      };
    }
  }
}

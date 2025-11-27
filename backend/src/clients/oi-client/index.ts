import axios, { AxiosInstance } from "axios";
import { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";
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
import TaskQueue from "../../utility/jobQueue";
import { languagePrompt, tagsPrompt } from "../../utility/prompts";
import { IpfsClient } from "../ipfs-client";
import {
  AuthsModule,
  ChatsModule,
  FilesModule,
  getToken,
  ModelsModule,
  OllamaModule,
  setToken,
} from "./implementations";
import {
  IAuthsModule,
  IChatsModule,
  IFilesModule,
  IModelsModule,
  IOllamaModule,
} from "./interfaces";
import { processLanguage } from "./language-processing";
import { processTags } from "./tags-processing";

export interface DocumentModel {
  id: string;
  user_id: string;
  hash: string;
  filename: string;
  path: string;
  data: {
    content: string;
  };
  meta: {
    name: string;
    content_type: string;
    size: number;
    data: Record<string, any>;
    collection_name: string;
  };
  access_control: null | any;
  created_at: number;
  updated_at: number;
}

export class OpenWebUIClient {
  public readonly ollama: IOllamaModule;
  public readonly chats: IChatsModule;
  public readonly files: IFilesModule;
  public readonly models: IModelsModule;
  public readonly auths: IAuthsModule;
  public axiosInstance!: AxiosInstance;

  constructor() {
    const axiosInstance = axios.create({
      baseURL: config.openWebUI.host,
      headers: {
        Accept: "application/json",
      },
    });
    this.axiosInstance = axiosInstance;
    this.ollama = new OllamaModule(axiosInstance);
    this.chats = new ChatsModule(axiosInstance);
    this.files = new FilesModule(axiosInstance);
    this.models = new ModelsModule(axiosInstance);
    this.auths = new AuthsModule(axiosInstance);
  }

  async health(): Promise<boolean> {
    try {
      let token = getToken();
      if (!token) {
        await this.#singInAndSetToken();
      }
      token = getToken();

      const res = await this.axiosInstance.get("/health", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return res.data.status;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async openWebUIReady(
    autodownload = config.openWebUI.autodownload
  ): Promise<boolean> {
    logger.info(
      `Checking Open WebUI. Truspace configured with ${config.ollama.model} LLM`
    );
    const models = await this.getBaseModels();
    if (models.find((m: string) => m === config.ollama.model)) {
      return true;
    } else {
      logger.info(`Open WebUI does not have ${config.ollama.model} LLM.`);
      if (autodownload === true) {
        logger.info(`Trying to pull ${config.ollama.model} ...`);
        const pullStatus = await this.ollama.pull(config.ollama.model);
        if (pullStatus !== "success") {
          logger.info(`Could not pull ${config.ollama.model}`);
          return false;
        } else {
          logger.info(`Successfully pulled ${config.ollama.model}`);
          return true;
        }
      } else return false;
    }
  }

  async getBaseModels(): Promise<string[]> {
    await this.#singInAndSetToken();
    const token = getToken();

    const res = await this.axiosInstance.get("/api/models/base", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const modelNames = res.data.data.map((m: any) => m.name);
    return modelNames;
  }

  #generateRequestId = (
    cid: string,
    type: "perspectives" | "language" | "tags"
  ): string => {
    return `req_${type}_${cid}`;
  };

  async uploadFile(file: UploadedFile): Promise<FileData | { error: string }> {
    await this.#singInAndSetToken();
    const fileData = await this.files.upload(file);
    if (fileData.error) {
      return { error: fileData.error };
    }
    return fileData;
  }

  async dispatchGeneratePerspectives(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ) {
    await this.#singInAndSetToken();

    const summariesInitialResponse = await this.#dispatchGenerateSummaries(
      document,
      fileData,
      requestId,
      prompts
    );

    return { summariesInitialResponse };
  }

  async dispatchGenerateTags(
    document: Document,
    fileData: FileData,
    requestId: string,
    _prompts: Prompt[]
  ) {
    await this.#singInAndSetToken();

    const tagsInitialResponse = await this.#dispatchGenerateTags(
      document,
      fileData,
      requestId
    );

    return { tagsInitialResponse };
  }

  async #dispatchGenerateSummaries(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ) {
    if (!fileData.error) {
      try {
        const oiReady = await this.openWebUIReady();
        if (!oiReady) {
          throw new Error(
            `Open WebUI doesn't have ${config.ollama.model} LLM, and it couldn't be downloaded`
          );
        }
        await this.#generatePerspectives({
          requestId,
          fileData,
          document,
          prompts,
        });
        const perspectivesRequest = {
          requestId,
          message: "Request accepted. Processing started.",
          statusEndpoint: `/api/perspectives/status/${requestId}`,
        };
        return perspectivesRequest;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(`Error processing request ${requestId}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
        return {
          requestId,
          message: "error",
          statusEndpoint: `/api/perspectives/status/${requestId}`,
        };
      }
    } else {
      console.error(`Error processing request ${requestId}:`, fileData.error);
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return {
        requestId,
        message: fileData.error,
        statusEndpoint: `/api/perspectives/status/${requestId}`,
      };
    }
  }

  async #dispatchGenerateTags(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompt = tagsPrompt
  ) {
    if (!fileData.error) {
      try {
        const oiReady = await this.openWebUIReady();
        if (!oiReady) {
          throw new Error(
            `Open WebUI doesn't have ${config.ollama.model} LLM, and it couldn't be downloaded`
          );
        }
        await this.#generateTags({
          requestId,
          fileData,
          document,
          prompt,
        });
        const tagsRequest = {
          requestId,
          message: "Request accepted. Processing started.",
          statusEndpoint: `/api/tags/status/${requestId}`,
        };
        return tagsRequest;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(`Error processing job ${requestId}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
        return {
          requestId: requestId,
          message: "error",
          statusEndpoint: `/api/tags/status/${requestId}`,
        };
      }
    } else {
      console.error(`Error processing request ${requestId}:`, fileData.error);
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return {
        requestId: requestId,
        message: fileData.error,
        statusEndpoint: `/api/tags/status/${requestId}`,
      };
    }
  }

  async #generateCompletion(
    fileData: FileData,
    prompt: string,
    title: string
  ): Promise<{ title: string; summary: string }> {
    let chatId;
    try {
      const newChatId = uuidv4();
      const newChatResult = await this.chats.create({
        chat: {
          models: [config.ollama.model],
          history: {
            currentId: newChatId,
            messages: {
              [newChatId]: {
                content: prompt,
                role: "user",
                files: [
                  {
                    type: "file",
                    file: fileData,
                  },
                ],
              },
            },
          },
          messages: [
            {
              content: prompt,
              role: "user",
              files: [
                {
                  type: "file",
                  file: fileData,
                },
              ],
            },
          ],
          files: [
            {
              type: "file",
              file: fileData,
            },
          ],
          params: {},
        },
      });
      chatId = newChatResult.id;

      const updateChatResult = await this.chats.update(newChatResult.id, {
        chat: {
          models: [config.ollama.model],
          history: {
            currentId: newChatId,
            messages: {
              [newChatId]: {
                content: prompt,
                role: "user",
                files: [
                  {
                    type: "file",
                    file: fileData,
                  },
                ],
              },
            },
          },
          messages: [
            {
              content: prompt,
              role: "user",
              files: [
                {
                  type: "file",
                  file: fileData,
                },
              ],
            },
          ],
          files: [
            {
              type: "file",
              file: fileData,
            },
          ],
          params: {},
        },
      });
      logger.debug(
        `updateChatResult\n${JSON.stringify(updateChatResult, null, 2).slice(0, 180)}...`
      );

      logger.debug(
        `Data for completion file content\n${JSON.stringify(fileData.data.content)}...`
      );
      logger.debug(
        `Data for completion file id\n${JSON.stringify(fileData.id)}...`
      );
      const chatCompletionResult = await this.chats.completion({
        background_tasks: {
          tags_generation: false,
          title_generation: false,
        },
        chat_id: newChatResult.id,
        model: config.ollama.model,
        files: [
          {
            type: "file",
            file: fileData,
            name: fileData.filename,
            id: fileData.id,
            url: `/api/v1/files/${fileData.id}`,
            status: "uploaded",
          },
        ],
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      logger.debug(
        `chatCompletionResult\n${JSON.stringify(chatCompletionResult, null, 2).slice(0, 180)}...`
      );
      const summary = chatCompletionResult.choices[0].message.content;

      return { title: title, summary: summary };
    } catch (error) {
      logger.error(
        `OIClient.#generateCompletion failed! ${JSON.stringify(error, null, 2)}`
      );
      throw error;
    } finally {
      await this.chats.delete(chatId);
    }
  }

  #generatePerspectives = async ({
    requestId,
    document,
    fileData,
    prompts,
  }: {
    requestId: string;
    fileData: FileData;
    document: Document;
    prompts: Prompt[];
  }): Promise<void> => {
    try {
      const results = [];
      for (const prompt of prompts) {
        const ollamaResponse = await this.#generateCompletion(
          fileData,
          prompt.prompt,
          prompt.title
        );

        results.push({
          ...ollamaResponse,
          perspectiveType: prompt.title,
          prompt: prompt.prompt,
        });
      }

      await results.map(async (result) => {
        const perspectiveRequest: PerspectiveRequest = {
          meta: {
            type: "perspective",
            perspectiveType: result.perspectiveType,
            workspaceOrigin: document.meta.workspaceOrigin,
            docId: document.docId,
            versionCid: document.cid,
            timestamp: new Date().toISOString(),
            data: result.summary,
            creator: config.ollama.model,
            creatorUiid: config.ollama.model,
            creatorType: "ai",
            prompt: result.prompt,
            model: config.ollama.model,
          },
        };

        logger.debug(`#SUMMARY:\n ${perspectiveRequest.meta.data}`);

        return new IpfsClient().createPerspective(perspectiveRequest);
      });
      TaskQueue.updateJobStatus(requestId, "completed");
    } catch (error) {
      logger.error(`Generating perspectives failed: ${error}`);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
    } finally {
      await this.files.delete(fileData.id);
    }
  };

  #generateTags = async ({
    requestId,
    document,
    fileData,
    prompt,
  }: {
    requestId: string;
    fileData: FileData;
    document: Document;
    prompt: Prompt;
  }): Promise<void> => {
    try {
      const ollamaResponse = await this.#generateCompletion(
        fileData,
        prompt.prompt,
        prompt.title
      );

      const result = {
        ...ollamaResponse,
        perspectiveType: prompt.title,
        prompt: prompt.prompt,
      };

      logger.debug(`#TAGS:\n ${result.summary}`);

      const tags: string[] = await processTags(result.summary, this.chats);

      // store max. 5 tags in IPFS;
      tags.slice(0, 5).map((tag: string) => {
        const tagRequest: TagRequest = {
          meta: {
            type: "tag",
            workspaceOrigin: document.meta.workspaceOrigin,
            docId: document.docId,
            versionCid: document.cid,
            timestamp: new Date().toISOString(),
            name: tag,
            color: "",
            creator: config.ollama.model,
            creatorUiid: config.ollama.model,
            creatorType: "ai",
          },
        };
        return new IpfsClient().createTag(tagRequest);
      });
      await TaskQueue.updateJobStatus(requestId, "completed");
    } catch (error) {
      logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await TaskQueue.updateJobStatus(requestId, "failed", errorMessage);
      throw error;
    }
  };

  async getConfig() {
    const res = await this.axiosInstance.get("/api/config", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return res.data;
  }

  async #singInAndSetToken() {
    const data = await this.auths.signIn({
      email: config.openWebUI.email,
      password: config.openWebUI.password,
    });
    const jwt = data.token;
    setToken(jwt);

    // Attach JWT to all future requests
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  }

  // Detect language in the document
  async dispatchDetectLanguage(document: Document, fileData: FileData) {
    await this.#singInAndSetToken();
    const langInitial = await this.#dispatchDetectLanguage(document, fileData);
    return { langInitial };
  }

  async #dispatchDetectLanguage(
    document: Document,
    fileData: FileData,
    prompt = languagePrompt
  ) {
    // 1. Generate request ID
    const requestId = this.#generateRequestId(document.cid, "language");

    if (fileData.error) {
      TaskQueue.updateJobStatus(requestId, "failed", fileData.error);
      return {
        requestId,
        message: fileData.error,
        statusEndpoint: `/api/language/status/${requestId}`,
      };
    }

    try {
      await TaskQueue.updateJobStatus(requestId, "processing");

      // run LLM
      const { summary } = await this.#generateCompletion(
        fileData,
        prompt.prompt,
        prompt.title
      );

      // process the result to extract language from summary
      const language: string = await processLanguage(summary, this.chats);

      // store result in IPFS
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

export const oiClient = new OpenWebUIClient();

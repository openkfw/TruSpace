import { UploadedFile } from "express-fileupload";
import { Document, FileData, Prompt } from "../../types/interfaces";

export interface BackendLLMClient {
  generateCompletion(
    fileData: FileData,
    prompt: string,
    title: string
  ): Promise<{ title: string; summary: string }>;

  dispatchGeneratePerspectives(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ): Promise<any>;

  dispatchGenerateTags(
    document: Document,
    fileData: FileData,
    requestId: string,
    prompts: Prompt[]
  ): Promise<any>;

  dispatchDetectLanguage(document: Document, fileData: FileData): Promise<any>;

  uploadFile(file: UploadedFile): Promise<FileData | { error: string }>;
}

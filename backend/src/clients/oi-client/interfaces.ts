import { UploadedFile } from "express-fileupload";
import { ChatForm, FileData } from "../../types/interfaces";

interface IOllamaModule {
  status(): Promise<any>;
  pull(name: string): Promise<string>;
}

interface IChatsModule {
  list(): Promise<any>;
  create(chat: ChatForm): Promise<any>;
  update(id: string, chat: ChatForm): Promise<any>;
  completion(c: any): Promise<any>;
  delete(chatId: string): Promise<boolean>;
}

interface IFilesModule {
  upload(file: UploadedFile): Promise<FileData>;
  delete(fileId: string): Promise<any>;
}

interface IModelsModule {
  getAll(): Promise<any>;
}

interface IAuthsModule {
  signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<any>;
  generateApiKey(jwt: string): Promise<any>;
  getApiKey(jwt: string): Promise<any>;
}

export {
  IAuthsModule,
  IChatsModule,
  IFilesModule,
  IModelsModule,
  IOllamaModule,
};

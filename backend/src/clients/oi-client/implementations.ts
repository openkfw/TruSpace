import { AxiosInstance } from "axios";
import { UploadedFile } from "express-fileupload";
import FormData from "form-data";
import { ChatForm, FileData } from "../../types/interfaces";
import {
  IAuthsModule,
  IChatsModule,
  IFilesModule,
  IModelsModule,
  IOllamaModule,
} from "./interfaces";

let token = "";

export function setToken(val: string) {
  token = val;
}

export function getToken() {
  return token;
}

class OllamaModule implements IOllamaModule {
  #axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.#axiosInstance = axiosInstance;
  }

  async pull(name: string): Promise<string> {
    const res = await this.#axiosInstance.post(
      "/ollama/api/pull",
      { name },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    const lines = res.data.split("\n").filter((line: string) => line.trim());
    const jsonObjects = lines.map((line: string) => JSON.parse(line));

    const lastStatus = jsonObjects[jsonObjects.length - 1].status;
    return lastStatus;
  }

  async status(): Promise<any> {
    try {
      const res = await this.#axiosInstance.get("/ollama", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return res.status === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

class ModelsModule implements IModelsModule {
  #axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.#axiosInstance = axiosInstance;
  }
  async getAll(): Promise<any> {
    const res = await this.#axiosInstance.get("/api/models", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }

  async status(): Promise<any> {
    const res = await this.#axiosInstance.get("/ollama", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }
}

class ChatModule implements IChatsModule {
  #axiosInstance!: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.#axiosInstance = axiosInstance;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.#axiosInstance.delete(`/api/v1/chats/${id}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }

  async update(id: string, chat: ChatForm): Promise<any> {
    const res = await this.#axiosInstance.post(`/api/v1/chats/${id}`, chat, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }

  async list(): Promise<any> {
    const res = await this.#axiosInstance("/api/v1/chats/list");
    return res.data;
  }

  async completion(completionReq: any): Promise<any> {
    try {
      const res = await this.#axiosInstance.post(
        "/api/chat/completions",
        completionReq,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token && { authorization: `Bearer ${token}` }),
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async create(chat: ChatForm): Promise<any> {
    const res = await this.#axiosInstance.post("/api/v1/chats/new", chat, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }
}

class FilesModule implements IFilesModule {
  #axiosInstance!: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.#axiosInstance = axiosInstance;
  }
  async delete(id: string): Promise<any> {
    const res = await this.#axiosInstance.delete(`/api/v1/files/${id}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { authorization: `Bearer ${token}` }),
      },
    });
    return res.data;
  }

  async upload(file: UploadedFile): Promise<FileData> {
    try {
      const url = "/api/v1/files/";

      const formData = new FormData();
      formData.append("file", file.data, {
        filename: file.name,
        contentType: file.mimetype,
      });

      const headers = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await this.#axiosInstance.post(url, formData, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

class AuthsModule implements IAuthsModule {
  #axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.#axiosInstance = axiosInstance;
  }
  async signIn(signInForm: { email: string; password: string }): Promise<any> {
    const res = await this.#axiosInstance.post(
      "/api/v1/auths/signin",
      signInForm,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  }
}

export {
  AuthsModule,
  ChatModule as ChatsModule,
  FilesModule,
  ModelsModule,
  OllamaModule,
};

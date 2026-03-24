import { Document } from "./truspace";

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: FileItem[];
}

interface FileData {
  id: string;
  user_id: string;
  hash: string;
  filename: string;
  data: {
    content: string;
  };
  error?: string;
}

interface FileItem {
  type: string;
  file: FileData;
}

interface Completion {
  stream?: boolean;
  model: string;
  messages: Message[];
  params?: Record<string, any>;
  files: FileItem[];
}

interface ChatForm {
  chat: {
    files: any[];
    models: string[];
    history: {
      messages: Record<string, Message>;
      currentId: string;
    };
    messages: Message[];
    params: Record<string, unknown>;
  };
}

type ChatCompletedForm = {
  model: string;
  messages: string[];
  chat_id: string;
  session_id: string;
};

interface QueryStatus {
  status: "processing" | "completed" | "error";
  document: Document;
  timestamp: Date;
  results?: any[];
  error?: string;
}

interface InitialResponse {
  requestId: string;
  message: string;
  statusEndpoint: string;
}

interface Prompt {
  title: string;
  prompt: string;
}

export {
  ChatCompletedForm,
  ChatForm,
  Completion,
  FileData,
  InitialResponse,
  Prompt,
  QueryStatus,
};

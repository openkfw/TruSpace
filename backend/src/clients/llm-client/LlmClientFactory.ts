import { config } from "../../config/config";
import { OpenWebUIClient } from "../oi-client";
import { OpenAICLient } from "../openAI-client";
import { BackendLLMClient } from "./llmClientMapping";

class LlmClientFactory {
  private static instance: BackendLLMClient;

  public static getInstance(): BackendLLMClient {
    if (!this.instance) {
      const provider = config.llmProvider;

      switch (provider) {
        case "openwebui":
          this.instance = new OpenWebUIClient();
          break;

        case "openai":
          this.instance = new OpenAICLient();
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    }
    return this.instance;
  }
}

export const llmClient = LlmClientFactory.getInstance();

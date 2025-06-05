interface RuntimeConfig {
   API_URL: string;
}

declare global {
   interface Window {
      RUNTIME_CONFIG?: RuntimeConfig;
   }
}

export {};

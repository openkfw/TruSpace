const config = {
   apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
   disableAllAIFunctionality:
      process.env.DISABLE_ALL_AI_FUNCTIONALITY === "true"
};

export default config;

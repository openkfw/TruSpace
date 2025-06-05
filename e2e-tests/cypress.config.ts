import { defineConfig } from "cypress";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  e2e: {
    experimentalStudio: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      console.log("setupNodeEvents");
    },
  },
  env: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    apiUrl: process.env.API_URL || "http://localhost:4000",
    username: process.env.USERNAME || "admin@example.com",
    password: process.env.PASSWORD || "Test123456789*",
  },
});

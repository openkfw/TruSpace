import { defineConfig } from "cypress";
import * as dotenv from "dotenv";
import * as Database from "better-sqlite3";
import { execSync } from "child_process";
dotenv.config();

export default defineConfig({
  e2e: {
    experimentalStudio: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("task", {
        runSqliteQuery({ dbPath, query, params }) {
          const db = new Database(dbPath);
          const stmt = db.prepare(query);
          const result = stmt.run(...(params || []));
          db.close();
          return result;
        },

        runBashScript(scriptPath) {
          try {
            const output = execSync(`bash ${scriptPath}`, {
              encoding: "utf-8",
            });
            return output;
          } catch (err) {
            console.error("Script error:", err);
            throw err;
          }
        },
      });
    },
  },
  env: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    apiUrl: process.env.API_URL || "http://localhost:4000",
    username: process.env.USERNAME || "admin@example.com",
    password: process.env.PASSWORD || "Test123456789*",
  },
});

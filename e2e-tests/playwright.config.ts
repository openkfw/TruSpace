import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import dotenv from "dotenv";

dotenv.config();

const chromiumExecutablePath = process.env.PW_CHROMIUM_EXECUTABLE_PATH;
const isCI = !!process.env.CI;

const testDir = defineBddConfig({
  features: "playwright/features/**/*.feature",
  steps: "playwright/steps/**/*.ts",
  outputDir: ".features-gen/playwright",
});

export default defineConfig({
  testDir,
  forbidOnly: isCI,
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  grepInvert: /@wip/,
  reporter: [
    ["line"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    testIdAttribute: "data-test-id",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumExecutablePath
          ? {
              executablePath: chromiumExecutablePath,
            }
          : undefined,
      },
    },
  ],
});

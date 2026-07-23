import fs from "node:fs";
import path from "node:path";

const e2eRoot = process.cwd();
const defaultUploadFile = path.resolve(e2eRoot, "cypress/files/Koalas.docx");
const defaultAvatarFile = path.resolve(
  e2eRoot,
  "../frontend/public/images/Logo.svg",
);

export const runtimeEnv = {
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "http://localhost:8000",
  username: process.env.USERNAME || "admin@example.com",
  password: process.env.PASSWORD || "Test123456789*",
  workspacePrefix:
    process.env.PLAYWRIGHT_WORKSPACE_PREFIX || "Playwright Test Workspace",
  uploadFile: path.resolve(
    e2eRoot,
    process.env.PLAYWRIGHT_UPLOAD_FILE || "cypress/files/Koalas.docx",
  ),
  avatarFile: path.resolve(
    e2eRoot,
    process.env.PLAYWRIGHT_AVATAR_FILE || "../frontend/public/images/Logo.svg",
  ),
};

export const ensureRuntimeFiles = () => {
  const uploadCandidates = [runtimeEnv.uploadFile, defaultUploadFile];
  const uploadMatch = uploadCandidates.find((candidate) => fs.existsSync(candidate));

  if (!uploadMatch) {
    throw new Error(
      `Could not find an upload fixture. Checked: ${uploadCandidates.join(", ")}`,
    );
  }

  runtimeEnv.uploadFile = uploadMatch;

  const avatarCandidates = [runtimeEnv.avatarFile, defaultAvatarFile];
  const avatarMatch = avatarCandidates.find((candidate) => fs.existsSync(candidate));

  if (!avatarMatch) {
    throw new Error(
      `Could not find an avatar fixture. Checked: ${avatarCandidates.join(", ")}`,
    );
  }

  runtimeEnv.avatarFile = avatarMatch;
};

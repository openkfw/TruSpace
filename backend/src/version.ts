// This file is automatically updated by the pre-commit hook
export const COMMIT_HASH = "placeholder";
export const SHORT_COMMIT_HASH = "placeholder";
export const BUILD_DATE = new Date().toISOString();

export interface BuildInfo {
  commitHash: string;
  shortCommitHash: string;
  buildDate: string;
}

export const getBuildInfo = (): BuildInfo => ({
  commitHash: COMMIT_HASH,
  shortCommitHash: SHORT_COMMIT_HASH,
  buildDate: BUILD_DATE,
});

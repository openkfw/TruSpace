import { execSync } from "child_process";

interface VersionInfo {
   commitHash: string;
   shortCommitHash: string;
   commitDate: string;
   branch: string;
   isDirty: boolean;
   buildDate: string;
}

let cachedVersion: VersionInfo | null = null;

export function getVersionInfo(): VersionInfo {
   if (cachedVersion) {
      return cachedVersion;
   }

   try {
      const commitHash = execSync("git rev-parse HEAD", {
         encoding: "utf8"
      }).trim();
      const shortCommitHash = execSync("git rev-parse --short HEAD", {
         encoding: "utf8"
      }).trim();
      const commitDate = execSync("git show -s --format=%ci HEAD", {
         encoding: "utf8"
      }).trim();
      const branch =
         execSync("git branch --show-current", { encoding: "utf8" }).trim() ||
         "detached";

      let isDirty = false;
      try {
         const status = execSync("git status --porcelain", {
            encoding: "utf8"
         }).trim();
         isDirty = status.length > 0;
      } catch {
         isDirty = false;
      }

      cachedVersion = {
         commitHash,
         shortCommitHash,
         commitDate,
         branch,
         isDirty,
         buildDate: new Date().toISOString()
      };

      return cachedVersion;
   } catch (error) {
      console.warn("Could not determine Git version info:", error.message);

      cachedVersion = {
         commitHash: "unknown",
         shortCommitHash: "unknown",
         commitDate: "unknown",
         branch: "unknown",
         isDirty: false,
         buildDate: new Date().toISOString()
      };

      return cachedVersion;
   }
}

export default getVersionInfo;

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { execSync } from "child_process";

const withNextIntl = createNextIntlPlugin();

function getCommitHash() {
   try {
      return execSync("git rev-parse --short HEAD").toString().trim();
   } catch {
      return "unknown";
   }
}

const nextConfig: NextConfig = {
   output: "standalone",
   env: {
      NEXT_PUBLIC_SHORT_COMMIT_HASH: getCommitHash()
   },
   turbopack: {
      resolveAlias: {
         canvas: "./empty-module.ts"
      }
   }
};

export default withNextIntl(nextConfig);

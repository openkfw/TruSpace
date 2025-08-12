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
   devIndicators: {
      appIsrStatus: false
   },
   experimental: {
      turbo: {
         resolveAlias: {
            canvas: "./empty-module.ts"
         }
      }
   },
   output: "standalone",
   env: {
      NEXT_PUBLIC_SHORT_COMMIT_HASH: getCommitHash()
   }
};

export default withNextIntl(nextConfig);

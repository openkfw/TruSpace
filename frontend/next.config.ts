import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { getVersionInfo } from "./src/version";

const withNextIntl = createNextIntlPlugin();

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
      NEXT_PUBLIC_SHORT_COMMIT_HASH: getVersionInfo().shortCommitHash
   }
};

export default withNextIntl(nextConfig);

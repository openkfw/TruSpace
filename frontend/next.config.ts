import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";


const withNextIntl = createNextIntlPlugin();

function getTruSpaceVersion() {
   return process.env.TRUSPACE_VERSION ?? "unknown";
}

const nextConfig: NextConfig = {
   experimental: {
      turbo: {
         resolveAlias: {
            canvas: "./empty-module.ts"
         }
      }
   },
   output: "standalone",
   env: {
      TRUSPACE_VERSION: getTruSpaceVersion(),
      DISABLE_ALL_AI_FUNCTIONALITY:
         process.env.DISABLE_ALL_AI_FUNCTIONALITY ?? "false"
   }
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
   output: "standalone"
};

export default withNextIntl(nextConfig);

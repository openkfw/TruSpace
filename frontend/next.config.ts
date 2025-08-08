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
         },
         rules: {
            "**/*.md": {
               loaders: ["raw-loader"],
               as: "*.js"
            }
         }
      }
   },
   output: "standalone",
   webpack: (config) => {
      config.module.rules.push({
         test: /\.md$/,
         use: "raw-loader"
      });
      return config;
   }
};

export default withNextIntl(nextConfig);

declare module "lusca" {
  import type { RequestHandler } from "express";

  const lusca: {
    csrf: (options?: Record<string, unknown>) => RequestHandler;
  };

  export default lusca;
}
import express, { Request, Response } from "express";
import { getHealthDb } from "../clients/db";
import { IpfsClient } from "../clients/ipfs-client";
import { oiClient } from "../clients/oi-client";
import { config } from "../config/config";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const [
    clusterStatus,
    pinSvcStatus,
    gatewayStatus,
    oiStatus,
    ollamaStatus,
    dbStatus,
  ] = await Promise.all([
    (async () => {
      try {
        return await new IpfsClient().clusterStatus();
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        return await new IpfsClient().pinSvcStatus();
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        return await new IpfsClient().gatewayStatus();
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        return config.disableAllAIFunctionality
          ? false
          : await oiClient.health();
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        return config.disableAllAIFunctionality
          ? false
          : await oiClient.ollama.status();
      } catch {
        return false;
      }
    })(),
    (async () => {
      try {
        return await getHealthDb();
      } catch {
        return false;
      }
    })(),
  ]);

  const result = {
    status:
      clusterStatus && pinSvcStatus && oiStatus && gatewayStatus && dbStatus,
    services: {
      Backend: true,
      Database: dbStatus,
      "IPFS Cluster": clusterStatus,
      "IPFS Pinning Service": pinSvcStatus,
      "IPFS Gateway": gatewayStatus,
      "Open WebUI": oiStatus,
      Ollama: ollamaStatus,
    },
  };
  res.json(result);
});

router.get("/peers", async (req: Request, res: Response) => {
  const peers = await new IpfsClient().getPeers();

  res.json(peers);
});

export default router;

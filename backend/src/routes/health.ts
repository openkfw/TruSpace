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
    clusterId,
    ipifyResponse,
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
    (async () => {
      try {
        return await new IpfsClient().clusterId();
      } catch {
        return {
          id: "",
          addresses: [],
          cluster_peers: [],
          cluster_peers_addresses: [],
          version: "",
          commit: "",
          rpc_protocol_version: "",
          error: "",
          ipfs: { id: "", addresses: [], error: "" },
          peername: "",
        };
      }
    })(),
    (async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        if (!response.ok) {
          return { ip: "" };
        }
        return await response.json();
      } catch {
        return { ip: "" };
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
    version: config.version,
    nodeId: clusterId?.ipfs?.id || "",
    clusterMultiaddress: `/ip4/${ipifyResponse?.ip}/tcp/9096/p2p/${clusterId?.id}`,
    nodeMultiaddress: `/ip4/${ipifyResponse?.ip}/tcp/4001/p2p/${clusterId?.ipfs?.id}`,
  };
  res.json(result);
});

router.get("/peers", async (req: Request, res: Response) => {
  const peers = await new IpfsClient().getPeers();

  res.json(peers);
});

export default router;

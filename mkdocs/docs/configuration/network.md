---
title: Network Configuration
description: IPFS and network settings
icon: material/lan
tags:
  - configuration
  - network
  - ipfs
---

# Network Configuration

Configure IPFS networking and peer connections.

## IPFS Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 4001 | TCP/UDP | Swarm - peer connections |
| 5001 | TCP | API - local operations |
| 8080 | TCP | Gateway - content access |

## Full Port Reference

TruSpace requires the following ports to be open for communication. Ensure the correct direction (inbound/outbound) and protocol (TCP/UDP) are configured in your firewall.

### Public-facing ports

| Port(s) | Protocol  | Direction        | Purpose                                 |
| ------- | --------- | ---------------- | ---------------------------------------- |
| 443     | TCP       | Inbound          | HTTPS traffic                            |
| 80      | TCP       | Inbound          | HTTP traffic (required for initial Certbot setup; can be closed afterwards) |
| 4001    | TCP & UDP | Inbound/Outbound | IPFS swarm (peer-to-peer communication)  |
| 9096    | TCP & UDP | Inbound/Outbound | IPFS cluster management                  |

### Ports mapped via reverse proxy (nginx)

| Port(s) | Protocol | Purpose                             |
| ------- | -------- | ------------------------------------ |
| 3000    | TCP      | TruSpace UI (main web interface)     |
| 3333    | TCP      | Open Web UI service (AI processing)  |
| 8000    | TCP      | API service (backend)                |

### Internal-only ports

These are used for communication between TruSpace components and typically do not need to be exposed externally, but must be reachable within your network/Docker network:

| Port(s) | Protocol | Purpose                          |
| ------- | -------- | --------------------------------- |
| 5001    | TCP      | IPFS API                          |
| 6831    | UDP      | Jaeger agent endpoint (tracing)   |
| 8080    | TCP      | IPFS HTTP Gateway                 |
| 8888    | TCP      | Prometheus endpoint (metrics)     |
| 9094    | TCP      | IPFS cluster management           |
| 9095    | TCP      | IPFS cluster management           |
| 9097    | TCP      | IPFS cluster management           |

See [Environment Variables](environment-variables.md#ipfs-cluster-settings) for the corresponding configuration variables, and the [Remote Setup guide](../getting-started/installation/remote.md) for a full nginx + Certbot walkthrough.

## Firewall Configuration

```bash
# Allow IPFS swarm connections
sudo ufw allow 4001/tcp
sudo ufw allow 4001/udp

# For cluster (if external)
sudo ufw allow 9096/tcp
```

## Private Networks

### Generate Swarm Key

```bash
# Install tool
go install github.com/Kubuxu/go-ipfs-swarm-key-gen/ipfs-swarm-key-gen@latest

# Generate key
ipfs-swarm-key-gen > swarm.key
```

### Deploy Swarm Key

Copy `swarm.key` to all nodes in the same location as the IPFS config.

### Remove Bootstrap Peers

```bash
./start.sh --remove-peers
```

## Peer Connection

### View Connected Peers

```bash
docker exec ipfs0 ipfs swarm peers
```

### Add Peer Manually

```bash
docker exec ipfs0 ipfs swarm connect /ip4/<IP>/tcp/4001/p2p/<PEER_ID>
```

## Bandwidth Management

Configure in IPFS config:

```json
{
  "Swarm": {
    "ConnMgr": {
      "LowWater": 100,
      "HighWater": 200,
      "GracePeriod": "20s"
    }
  }
}
```

## Advanced Configuration Reference

TruSpace's storage layer is built on two separate services, each with its own configuration file and its own scope of responsibility. Ports and bandwidth settings above only scratch the surface — both services expose a large number of additional options that administrators can tune for their environment.

### IPFS (Kubo) vs. IPFS Cluster: who configures what?

| Service | Config file | Responsible for |
|---------|-------------|------------------|
| **IPFS (Kubo)** | `config` (JSON, one per node) | The actual data/networking layer: swarm addresses & transports, the datastore/blockstore, the API and Gateway servers, DHT/content routing, bitswap, connection management, pubsub, private-network (swarm key) settings, peering with specific nodes |
| **IPFS Cluster** | `service.json` (one per cluster peer) | Orchestration on top of IPFS: which peer pins which content and how many replicas exist (replication factor), consensus between cluster peers (CRDT), the REST/pin-service/ipfs-proxy APIs used by TruSpace, monitoring/metrics/tracing, and the datastore used to persist cluster state (Pebble) |

In short: **IPFS decides how data moves and is stored on a single node**, while **IPFS Cluster decides which nodes should store which data, and keeps that decision in sync across all nodes**.

### Official configuration references

Both projects document every available option in detail:

- **IPFS (Kubo) config reference:** [github.com/ipfs/kubo/blob/master/docs/config.md](https://github.com/ipfs/kubo/blob/master/docs/config.md)
- **IPFS Cluster config reference:** [ipfscluster.io/documentation/reference/configuration](https://ipfscluster.io/documentation/reference/configuration/)

Use these as the source of truth — the tables below only summarize the sections that are most relevant to a TruSpace deployment.

### What TruSpace configures in IPFS today

Looking at a representative node `config`, TruSpace currently relies mostly on defaults, with a few deliberate customizations:

- **`Addresses.Swarm`** — listens on TCP/4001, plus QUIC, WebRTC-direct and WebTransport variants over IPv4/IPv6, so peers can connect over whichever transport works best.
- **`Addresses.API` / `Addresses.Gateway`** — bound to `0.0.0.0` on 5001/8080 (internal-only, see the port table above).
- **`Peering.Peers`** — used to keep a persistent connection to specific known peers (useful for guaranteeing connectivity to other TruSpace nodes regardless of DHT discovery).
- **`Discovery.MDNS.Enabled`** — local network peer discovery is on, handy for LAN/dev setups.
- **`Datastore.StorageMax` / `StorageGCWatermark`** — a repo size cap (10GB) and GC trigger threshold (90%), so nodes don't fill the disk unbounded.
- **`Routing.Type: "dht"`** — standard DHT-based content routing (as opposed to only using delegated routers).

Sections such as `Swarm.ConnMgr`, `Swarm.ResourceMgr`, `Bitswap`, `Reprovider`, `Pinning.RemoteServices`, `AutoTLS`, and `Experimental` are left at their empty/default values in the example, meaning admins can opt into tuning them (e.g. connection limits, resource limits, remote pinning services, automatic TLS certs, filestore/URLstore support) without TruSpace getting in the way.

### What TruSpace configures in IPFS Cluster today

The cluster `service.json` is more heavily customized, since it drives how TruSpace nodes cooperate:

- **`cluster.listen_multiaddress`** — cluster management traffic on 9096 (TCP + QUIC/UDP), matching the port table above.
- **`cluster.connection_manager`** — a higher connection ceiling (`high_water: 400`, `low_water: 100`) than the IPFS defaults, since cluster peers talk to each other constantly.
- **`cluster.replication_factor_min` / `max`** — both set to `-1`, meaning "replicate to all peers" (no partial replication). Admins running larger clusters may want to set explicit numbers here to control storage cost vs. redundancy.
- **`cluster.pin_only_on_trusted_peers` / `disable_repinning`** — repinning after a peer failure is disabled by default, and pinning isn't restricted to trusted peers only.
- **`consensus.crdt.trusted_peers: ["*"]`** — all peers are currently trusted for CRDT consensus updates; this can be locked down to specific peer IDs in stricter environments.
- **`api.restapi` / `api.pinsvcapi` / `api.ipfsproxy`** — the three HTTP APIs TruSpace talks to (cluster REST API on 9094, IPFS-proxy on 9095, pinning-service API on 9097), including CORS settings (currently permissive with `cors_allowed_origins: ["*"]`).
- **`allocator.balanced` / `informer.tags` / `informer.disk`** — pin allocation is balanced across peers by a custom `group` tag plus free disk space, which is how TruSpace can steer pins to specific node groups.
- **`observations.metrics` / `observations.tracing`** — Prometheus metrics (port 8888) and Jaeger tracing (port 6831) hooks exist but are disabled (`enable_stats`/`enable_tracing: false`) — ready to switch on for deeper observability.
- **`datastore.pebble`** — detailed tuning of the underlying Pebble LSM-tree store (cache size, compaction thresholds, per-level file sizes) for cluster state persistence; most admins can leave this at the defaults.

### Extension points for administrators

Some options worth highlighting for teams operating their own TruSpace deployment:

- **Replication strategy**: tune `replication_factor_min`/`max` and `allocator`/`informer` settings to control how many copies of each file exist and which nodes receive them.
- **Security posture**: restrict `consensus.crdt.trusted_peers` and tighten `cors_allowed_origins` on the cluster APIs instead of using wildcards in production.
- **Observability**: enable `observations.metrics` and `observations.tracing` to feed Prometheus/Jaeger already referenced in the [port tables](#internal-only-ports) above.
- **Resource limits**: both services expose connection manager and resource manager sections (`Swarm.ConnMgr`/`Swarm.ResourceMgr` in IPFS, `cluster.connection_manager`/`resource_manager` in Cluster) to protect nodes from resource exhaustion under heavy peer load.

> Changes to either config file require a restart of the corresponding service (`ipfs daemon` / `ipfs-cluster-service daemon`) to take effect.

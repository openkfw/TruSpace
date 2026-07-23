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

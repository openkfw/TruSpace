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

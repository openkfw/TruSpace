---
title: Connecting Nodes
description: Link TruSpace installations for sync
icon: material/connection
tags:
  - networking
  - ipfs
  - sync
---

# Connecting Nodes

Connect multiple TruSpace installations for decentralized sync.

## Automatic Connection

The easiest way to connect nodes:

### On the Target Node

Generate encrypted connection details:

```bash
./scripts/fetch-connection.sh -e
```

This creates:
- `.connection` - Connection details
- `.connection.password` - Decryption password

### Transfer Files

Securely transfer both files to the connecting node.

### On Your Node

Connect using the received files:

```bash
./scripts/connectPeer-automatic.sh .connection .connection.password
```

## Manual Connection

For more control:

```bash
./scripts/connectPeer-manually.sh \
  <peer_ip> \
  <ipfs_peer_id> \
  <cluster_peer_id> \
  <ipfs_container_id> \
  <cluster_container_id> \
  [swarm_key_path] \
  [cluster_secret_path]
```

### Get Peer IDs

```bash
# IPFS Peer ID
docker exec ipfs0 ipfs id -f "<id>"

# Cluster Peer ID
docker exec cluster0 ipfs-cluster-ctl id
```

## Verify Connection

### Check IPFS Peers

```bash
docker exec ipfs0 ipfs swarm peers
```

### Check Cluster Peers

```bash
docker exec cluster0 ipfs-cluster-ctl peers ls
```

## Private Networks

For secure private networks:

1. Generate swarm key on first node
2. Share swarm key with all trusted nodes
3. Remove public bootstrap peers
4. Connect peers manually

## Troubleshooting

### Connection Refused

- Check firewall (port 4001)
- Verify IP addresses
- Check if peers are online

### Cluster Not Syncing

- Verify cluster secret matches
- Check cluster logs
- Restart cluster service

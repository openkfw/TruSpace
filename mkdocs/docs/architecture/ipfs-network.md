---
title: IPFS Network
description: Decentralized storage with IPFS
icon: material/lan
tags:
  - ipfs
  - networking
---

# IPFS Network

How TruSpace uses IPFS for decentralized storage.

## What is IPFS?

IPFS (InterPlanetary File System) is a peer-to-peer protocol for storing and sharing data in a distributed file system.

### Content Addressing

Instead of location-based URLs, IPFS uses **Content IDs (CIDs)** - hashes of the content itself:

```
QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy
```

This means:
- Same content = same CID everywhere
- Content can be fetched from any peer
- Built-in integrity verification

## TruSpace IPFS Architecture

```mermaid
flowchart LR
    subgraph Node1["TruSpace Node 1"]
        I1[IPFS Node]
        C1[IPFS Cluster]
    end
    
    subgraph Node2["TruSpace Node 2"]
        I2[IPFS Node]
        C2[IPFS Cluster]
    end
    
    I1 <-->|Bitswap| I2
    C1 <-->|CRDT Sync| C2
```

## IPFS Cluster

IPFS Cluster coordinates pinning across multiple nodes:

- **Automatic replication**: Content pinned on one node replicates to others
- **Consensus**: CRDT-based for availability over consistency
- **Pin management**: Track what should be stored where

## Connecting Nodes

### Automatic Connection

```bash
# Generate connection details on Node A
./scripts/fetch-connection.sh -e

# Connect from Node B
./scripts/connectPeer-automatic.sh .connection .connection.password
```

### Manual Connection

```bash
./scripts/connectPeer-manually.sh \
  <peer_ip> \
  <ipfs_peer_id> \
  <cluster_peer_id> \
  <ipfs_container> \
  <cluster_container>
```

## Private Networks

For private deployments:

1. Generate a swarm key
2. Share only with trusted peers
3. Configure IPFS to use private mode

```bash
# All nodes must have the same swarm.key
# Placed in IPFS configuration directory
```

The swarm key is a shared secret used to permit only authorized nodes onto the IPFS network. It looks like this:

```bash
/key/swarm/psk/1.0.0/
/base16/
2f1b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809
```

Generate one with the [ipfs-swarm-key-gen script](https://github.com/Kubuxu/go-ipfs-swarm-key-gen/blob/master/ipfs-swarm-key-gen/main.go).

In addition to the swarm key, the **`CLUSTER_SECRET`** authenticates and authorizes nodes joining the IPFS Cluster itself, so only trusted peers can pin and sync content:

```bash
CLUSTER_SECRET=c141a2511dae98dde9a8606a0c259d362c7449b12ce3c47f69d1e12203246f92
```

Generate one with [this cluster secret generation script](https://gist.github.com/erangaeb/4ab3e226c5c5e91e62121d62b95d9824). With both secrets in place, documents are synced only to trusted IPFS nodes, all inter-node communication is encrypted, and documents themselves are encrypted with the workspace ID.

## Data Flow

### Upload

1. Document encrypted by backend
2. Added to local IPFS node → CID generated
3. Cluster pins the content
4. Replicates to connected peers

### Retrieval

1. Request by CID
2. Local check first
3. If not found, fetch from peers
4. Decrypt and serve to user

## Configuration

Key IPFS settings in environment:

```env
IPFS_PROFILE=server        # Or 'lowpower' for Raspberry Pi
IPFS_BOOTSTRAP_REMOVE=true # For private networks
```

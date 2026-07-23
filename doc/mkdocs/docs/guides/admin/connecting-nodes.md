---
title: Connecting Nodes
description: Link TruSpace installations for decentralized sync using automated or manual scripts
icon: material/connection
tags:
  - networking
  - ipfs
  - sync
  - admin
---

# Connecting Nodes

Connecting two TruSpace installations allows them to sync documents, workspaces, metadata, and AI perspectives automatically via IPFS. Each organisation runs its own node; connecting them enables fault-tolerant, decentralised collaboration.

---

## How It Works

When nodes are connected:

- The **IPFS swarm** establishes a peer-to-peer connection between nodes (port `4001`)
- The **IPFS Cluster** coordinates which content is pinned where (port `9096`)
- A shared **cluster secret** authenticates cluster membership
- A shared **swarm key** isolates the private network from the public IPFS network
- Documents and metadata replicate automatically once pinned

---

## Required Ports

Open these ports on both nodes before connecting:

| Port | Protocol | Purpose |
|---|---|---|
| `4001` | TCP + UDP | IPFS swarm (peer connections) |
| `9096` | TCP | IPFS Cluster swarm |

```bash
sudo ufw allow 4001/tcp
sudo ufw allow 4001/udp
sudo ufw allow 9096/tcp
```

---

## Automatic Connection (Recommended)

TruSpace provides two scripts that handle the full connection setup.

### Step 1 — On the Target Node: Generate Connection Details

**Encrypted mode** (recommended for secure transfer):

```bash
./scripts/fetch-connection.sh -e
```

This creates two files:
- `.connection` — encrypted connection details (IP, IPFS peer ID, cluster peer ID, swarm key, cluster secret)
- `.connection.password` — the decryption password

**Unencrypted mode** (for trusted local networks only):

```bash
./scripts/fetch-connection.sh
```

Creates only `.connection` (plaintext).

### Step 2 — Transfer the Files

Securely transfer both `.connection` and `.connection.password` to the connecting node (e.g. via `scp`, encrypted email, or a password manager).

### Step 3 — On Your Node: Run the Connection Script

Place the received files in the TruSpace root directory, then:

**Encrypted mode:**

```bash
./scripts/connectPeer-automatic.sh .connection .connection.password
```

**Unencrypted mode:**

```bash
./scripts/connectPeer-automatic.sh .connection
```

The script will:
1. Decrypt and parse the connection details
2. Add the peer's IPFS address to `Bootstrap` in `/volumes/ipfs0/config`
3. Add the cluster peer address to `peer_addresses` in `/volumes/cluster0/service.json`
4. Copy the swarm key and cluster secret into place
5. Restart both the IPFS and cluster containers automatically

---

## Manual Connection

For more control, use the manual script directly:

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

**Arguments:**

| Argument | Description |
|---|---|
| `peer_ip` | IP address of the target node |
| `ipfs_peer_id` | libp2p Peer ID of the target IPFS node |
| `cluster_peer_id` | libp2p Peer ID of the target IPFS Cluster node |
| `ipfs_container_id` | Local IPFS container name (usually `ipfs0`) |
| `cluster_container_id` | Local cluster container name (usually `cluster0`) |
| `swarm_key_path` | *(Optional)* Path to swarm key file for private networking |
| `cluster_secret_path` | *(Optional)* Path to a file containing the cluster secret |

**Example:**

```bash
./scripts/connectPeer-manually.sh \
  217.0.0.1 \
  QmXabc...123 \
  QmYdef...456 \
  ipfs0 \
  cluster0 \
  ./swarm.key \
  ./cluster_secret.txt
```

### Getting Peer IDs from the Target Node

```bash
# IPFS Peer ID
docker exec ipfs0 ipfs id -f "<id>"

# Cluster Peer ID
docker exec cluster0 ipfs-cluster-ctl id
```

---

## What the Scripts Configure

### IPFS Network (`/volumes/ipfs0/config`)

Adds the peer's IPFS multiaddress to the `Bootstrap` section:

```
/ip4/<peer_ip>/tcp/4001/p2p/<ipfs_peer_id>
```

The swarm key (`/volumes/ipfs0/swarm.key`) isolates the network — only nodes with the same key can connect. It looks like:

```
/key/swarm/psk/1.0.0/
/base16/
7c2c973709f5a961b...8926a65b15477cf5
```

### IPFS Cluster (`/volumes/cluster0/service.json`)

Adds the peer's cluster multiaddress to `peer_addresses`:

```
/ip4/<peer_ip>/tcp/9096/p2p/<cluster_peer_id>
```

The `secret` field must match the same value on all cluster peers.

---

## Verifying the Connection

### Check IPFS Peers

```bash
docker exec ipfs0 ipfs swarm peers
```

The target node's peer ID should appear in the list.

### Check Cluster Peers

```bash
docker exec cluster0 ipfs-cluster-ctl peers ls
```

### Check for Pinning Errors

```bash
docker exec cluster0 ipfs-cluster-ctl status | grep PIN_ERROR
```

All items should show `PINNED`. Any `PIN_ERROR` entries indicate replication problems — check connectivity and cluster secret consistency.

### Practical Verification

Upload a document to a **public workspace** on one node. It should become visible on the other node within a few minutes.

---

## Troubleshooting

### Connection Refused

- Confirm port `4001` and `9096` are open on both firewalls
- Verify the peer IP is correct and reachable: `ping <peer_ip>`
- Check that both nodes are running: `docker ps`

### Cluster Not Syncing

- Confirm `CLUSTER_SECRET` in `.env` is identical on all nodes
- Check cluster logs: `docker logs cluster0`
- Restart the cluster: `docker compose restart cluster0`

### Swarm Key Mismatch

All nodes in a private network must use the same `swarm.key`. If keys differ, IPFS nodes will refuse to connect.

```bash
# Verify swarm key fingerprint matches on both nodes
docker exec ipfs0 ipfs key list -l
```

For more diagnostics, see the [Troubleshooting guide](../../reference/troubleshooting.md#ipfs-cluster).

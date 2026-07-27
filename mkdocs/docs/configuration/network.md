---
title: Network Configuration
description: IPFS network settings and enterprise-grade security for permissioned deployments
icon: material/lan
tags:
  - configuration
  - network
  - security
---

# Network Configuration

Configure IPFS networking, peer connections, and enterprise-grade access controls for TruSpace.

This guide gives an overview of the network configuration options available for TruSpace, including firewall settings, peer connection management, and security layers to ensure a private and secure deployment. For more advanced IPFS and IPFS cluster configuration options, see the [Advanced Configuration Reference](#advanced-configuration-reference) section below.

---

## Overview

TruSpace can be deployed as a private, permissioned system suitable for enterprises that need strict control over who can access their installation. Security is implemented across multiple layers:

- **Network layer**: Private IPFS network isolation
- **Connection layer**: Restricted peer connections with specific IPFS nodes
- **Firewall layer**: IP-based access control
- **Authentication layer**: Email domain restrictions and user confirmation
- **Password layer**: Strict password requirements

---

## IPFS Ports Reference

| Port | Protocol | Purpose                  |
| ---- | -------- | ------------------------ |
| 4001 | TCP/UDP  | Swarm - peer connections |
| 5001 | TCP      | API - local operations   |
| 8080 | TCP      | Gateway - content access |
| 9096 | TCP      | IPFS Cluster swarm       |

### Firewall Configuration

```bash
# Allow IPFS swarm connections
sudo ufw allow 4001/tcp
sudo ufw allow 4001/udp

# For cluster (if external)
sudo ufw allow 9096/tcp
```

---

### Layer 1: Peer Connection Control

A private IPFS network is the foundation for enterprise deployments. It completely isolates your TruSpace nodes from the public IPFS network, ensuring that only your authorized nodes can participate.

**This layer is mandatory** and should always be configured before any peer connections.

**For detailed setup instructions**, see [Connecting Nodes](../guides/admin/connecting-nodes.md).

#### Required Ports

Both nodes must have these ports open and reachable:

| Port   | Protocol  | Purpose                       |
| ------ | --------- | ----------------------------- |
| `4001` | TCP + UDP | IPFS swarm (peer connections) |
| `9096` | TCP       | IPFS Cluster swarm            |

#### View Connected Peers

Verify that only expected nodes are connected:

```bash
# List connected IPFS peers
docker exec ipfs0 ipfs swarm peers

# List cluster peers
docker exec cluster0 ipfs-cluster-ctl peers ls
```

**Result**: Only explicitly configured nodes can sync data, preventing unauthorized access.

#### Remove Bootstrap Peers

Remove all default public bootstrap peers to prevent accidental connection to the public IPFS network:

```bash
./start.sh --remove-peers
```

Alternatively, manually configure in `/volumes/ipfs0/config`:

```json
{
  "Bootstrap": []
}
```

**Result**: Only nodes with the same `swarm.key` can form a peer connection, completely isolating your network.

---

### Layer 2: IP Filtering

Restrict network access to known company networks and other authorized nodes.

#### Whitelist Company IP Ranges

Configure your firewall to only allow connections from specific IP ranges:

```bash
# Allow IPFS from company network only
sudo ufw allow from 203.0.113.0/24 to any port 4001

# Allow cluster communication from specific nodes
sudo ufw allow from 203.0.113.10 to any port 9096
sudo ufw allow from 203.0.113.20 to any port 9096
```

#### Restrict Frontend/Backend Access

For web interface access, restrict to company networks:

```bash
# Allow web access only from company IPs
sudo ufw allow from 203.0.113.0/24 to any port 3000
sudo ufw allow from 203.0.113.0/24 to any port 8000
```

**Result**: Network-level isolation prevents unauthorized external access.

---

### Layer 3: Email Domain Restriction

Restrict user registration to specific email domains (typically your company domain).

#### Configuration

Add to `.env`:

```env
RESTRICTED_EMAIL_DOMAINS=example.com,trusted-partner.com
```

Multiple domains are supported with comma separation. Users attempting to register with email addresses outside these domains will be rejected.

**Result**: Only employees and authorized partners can create accounts.

---

### Layer 4: User Activation Requirement

Require users to confirm their email address before accessing TruSpace.

#### Configuration

Add to `.env`:

```env
REGISTER_USERS_AS_INACTIVE=true
```

When enabled:

- New users receive a confirmation email upon registration
- Users must click the confirmation link before they can log in
- Only valid email addresses can complete registration
- Requires SMTP to be configured (see [Email Settings](./environment-variables.md#email-settings))

#### Email Configuration

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_TLS=true
EMAIL_SENDER=noreply@example.com
```

**Result**: Verifies that user email addresses are real and belong to authorized domains.

---

### Layer 5: Strict Password Requirements

Enforce strong passwords to prevent credential-based attacks.

#### Configuration

```env
REQUIRE_STRICT_PASSWORDS=true
```

When enabled (default), passwords must meet these requirements:

- **Minimum 12 characters**
- **At least one uppercase letter** (A-Z)
- **At least one number** (0-9)
- **At least one special character** (!@#$%^&\*)

This is enabled by default and recommended for all production deployments.

**Result**: Prevents weak password attacks that could compromise user accounts.

---

## Bandwidth Management

Control connection limits to prevent resource exhaustion:

```json title="/volumes/ipfs0/config"
{
  "Swarm": {
    "ConnMgr": {
      "LowWater": 50,
      "HighWater": 100,
      "GracePeriod": "20s"
    }
  }
}
```

| Setting       | Purpose                                                |
| ------------- | ------------------------------------------------------ |
| `LowWater`    | Minimum number of peers to maintain connections to     |
| `HighWater`   | Maximum number of peer connections                     |
| `GracePeriod` | Time before closing connections when above `HighWater` |

For enterprise deployments with few trusted peers, these values can be set lower than defaults.

---

## Verification Checklist

Before deploying to production, verify all security layers:

- [ ] **Private Network**: Same `swarm.key` and `cluster secret` deployed on all nodes
- [ ] **Bootstrap**: No public bootstrap peers in `/volumes/ipfs0/config`
- [ ] **Peer Connections**: Only expected nodes appear in `ipfs swarm peers` and `cluster peers ls`
- [ ] **Firewall**: IP restrictions are in place for sensitive ports
- [ ] **Email Domains**: `RESTRICTED_EMAIL_DOMAINS` is configured
- [ ] **User Activation**: `REGISTER_USERS_AS_INACTIVE=true` is set
- [ ] **SMTP**: Email service is configured and tested
- [ ] **Strict Passwords**: `REQUIRE_STRICT_PASSWORDS=true` is set (default)

---

## Troubleshooting

### Nodes Cannot Connect

- Verify both nodes have **identical** `swarm.key` and `cluster secret`
- Confirm firewall rules allow ports `4001` and `9096` in both directions
- Check that both nodes are running: `docker ps`

### Public Network Connections Appearing

- Verify `Bootstrap` is empty: `docker exec ipfs0 ipfs bootstrap list`
- Restart IPFS after removing bootstrap peers: `docker compose restart ipfs0`

### Registration Not Working

- Verify SMTP is configured: `docker logs backend` for email errors
- Check email domain matches `RESTRICTED_EMAIL_DOMAINS`
- Ensure confirmation email was received

### Users Cannot Login After Registration

- Verify users clicked the confirmation link in their email
- Check `REGISTER_USERS_AS_INACTIVE` is set to `true`
- Review backend logs: `docker logs backend`

For more diagnostics, see the [Troubleshooting guide](../reference/troubleshooting.md#ipfs--cluster).

---

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
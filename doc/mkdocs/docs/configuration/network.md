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

| Port | Protocol | Purpose |
|------|----------|---------|
| 4001 | TCP/UDP | Swarm - peer connections |
| 5001 | TCP | API - local operations |
| 8080 | TCP | Gateway - content access |
| 9096 | TCP | IPFS Cluster swarm |

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

| Port | Protocol | Purpose |
|---|---|---|
| `4001` | TCP + UDP | IPFS swarm (peer connections) |
| `9096` | TCP | IPFS Cluster swarm |

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
- **At least one special character** (!@#$%^&*)

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

| Setting | Purpose |
|---------|---------|
| `LowWater` | Minimum number of peers to maintain connections to |
| `HighWater` | Maximum number of peer connections |
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

For more diagnostics, see the [Troubleshooting guide](../../reference/troubleshooting.md#ipfs--cluster).

---
title: Environment Variables
description: Complete reference for all TruSpace environment variables
icon: material/file-cog
tags:
  - configuration
  - environment
  - reference
---

# Environment Variables

Complete reference for all TruSpace configuration options.

## Quick Reference

| Category                       | Variables                                              |
| ------------------------------- | ------------------------------------------------------ |
| [Core](#core-settings)         | `NODE_ENV`, `LOG_LEVEL`, `API_PORT`, `DATABASE_PATH`   |
| [Network](#network-settings)   | `CORS_ORIGIN`, `FRONTEND_PORT`, `BACKEND_PORT`         |
| [Content Security Policy](#content-security-policy) | `CONTENT_SECURITY_POLICY_*`, `RATE_LIMIT_PER_MINUTE` |
| [IPFS](#ipfs-settings)         | `IPFS_*`, `START_PRIVATE_NETWORK`, `SWARM_PORT`        |
| [IPFS Cluster](#ipfs-cluster-settings) | `CLUSTER_*`, `OPEN_API_PORT`, `PINNING_SERVICE_PORT` |
| [AI](#ai-settings)             | `OLLAMA_*`, `AUTO_DOWNLOAD`, `DISABLE_ALL_AI_FUNCTIONALITY` |
| [Open Web UI](#open-web-ui-settings) | `OPENWEBUI_HOST`, `OPEN_WEBUI_PORT`, `ADMIN_USER_EMAIL`, `WEBUI_SECRET_KEY` |
| [Security](#security-settings) | `JWT_SECRET`, `MASTER_PASSWORD`, `CLUSTER_SECRET`, `REQUIRE_STRICT_PASSWORDS` |
| [Email](#email-settings)       | `SMTP_*`, `EMAIL_SENDER`, `REGISTER_USERS_AS_INACTIVE` |

---

## Core Settings

### `NODE_ENV`

Application environment mode.

| Value         | Description                             |
| ------------- | --------------------------------------- |
| `development` | Development mode with verbose logging   |
| `production`  | Production mode with optimized settings |

```env
NODE_ENV=production
```

### `LOG_LEVEL`

Logging verbosity level.

| Value   | Description                      |
| ------- | -------------------------------- |
| `debug` | All messages including debug     |
| `info`  | Informational messages and above |
| `warn`  | Warnings and errors only         |
| `error` | Errors only                      |

```env
LOG_LEVEL=info
```

### `API_PORT`

Port on which the backend API server listens internally.

```env
API_PORT=8000
```

### `DATABASE_PATH`

Path to the SQLite database file which stores user credentials and other sensitive data that is not decentralized.

```env
DATABASE_PATH=/app/data/truspace.db
```

---

## Network Settings

### `CORS_ORIGIN`

Allowed origins for CORS requests. Set to your domain.

```env
# Local development
CORS_ORIGIN=http://localhost:3000

# Production
CORS_ORIGIN=https://yourdomain.com
```

### `FRONTEND_PORT`

Port for the frontend service.

```env
FRONTEND_PORT=3000
```

### `BACKEND_PORT`

Port for the backend API service.

```env
BACKEND_PORT=8000
```

### `OI_CORS_ALLOW_ORIGIN`

CORS origin for Open Web UI.

```env
OI_CORS_ALLOW_ORIGIN=http://localhost:3000
```

---

## Content Security Policy

Optional Content Security Policy (CSP) directives enforced by the backend. Each accepts a comma-separated list of URLs.

| Variable | CSP directive | Required |
|---|---|---|
| `CONTENT_SECURITY_POLICY_DEFAULT_URLS` | `default-src` | false |
| `CONTENT_SECURITY_POLICY_IMG_URLS` | `img-src` | false |
| `CONTENT_SECURITY_POLICY_FRAME_URLS` | `frame-src` | false |
| `CONTENT_SECURITY_POLICY_SCRIPT_URLS` | `script-src` | false |
| `CONTENT_SECURITY_POLICY_WORKER_URLS` | `worker-src` | false |

```env
CONTENT_SECURITY_POLICY_DEFAULT_URLS=https://example.com
CONTENT_SECURITY_POLICY_IMG_URLS=https://images.example.com
```

### `RATE_LIMIT_PER_MINUTE`

Maximum number of requests allowed per minute per IP address.

```env
RATE_LIMIT_PER_MINUTE=200
```

---

## IPFS Settings

### `IPFS_PROFILE`

IPFS configuration profile.

| Value      | Description                            |
| ---------- | -------------------------------------- |
| `server`   | Optimized for servers (default)        |
| `lowpower` | Reduced resource usage for Pi/embedded |

```env
IPFS_PROFILE=server
```

### `IPFS_BOOTSTRAP_REMOVE`

Remove default IPFS bootstrap nodes (for private networks).

```env
IPFS_BOOTSTRAP_REMOVE=true
```

### `IPFS_PATH`

Custom IPFS data directory.

```env
IPFS_PATH=/custom/ipfs/path
```

### `START_PRIVATE_NETWORK`

Option to allow or disable connection to public IPFS bootstrap nodes.

```env
START_PRIVATE_NETWORK=true
```

### IPFS Kubo Node Ports

| Variable | Description | Default |
|---|---|---|
| `SWARM_PORT` | Swarm port for IPFS peer-to-peer networking. | 4001 |
| `IPFS_API_PORT` | IPFS API port (used for pinning and data manipulation). | 5001 |
| `IPFS_GATEWAY_PORT` | IPFS Gateway port (used for fetching files from IPFS). | 8080 |

---

## IPFS Cluster Settings

### Cluster Service Addresses

| Variable | Description | Default |
|---|---|---|
| `IPFS_CLUSTER_HOST` | Address of the IPFS Cluster REST API. | `http://cluster0:9094` |
| `IPFS_PINSVC_HOST` | Address of the IPFS pinning service API. | `http://cluster0:9097` |
| `IPFS_GATEWAY_HOST` | Address of the IPFS gateway (used to fetch content). | `http://ipfs0:8080` |
| `CLUSTER_MONITORPINGINTERVAL` | Interval between cluster health checks. | `2s` |
| `CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS` | Multiaddress for the cluster REST API to bind to. | `/ip4/0.0.0.0/tcp/9094` |
| `CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS` | Multiaddress for the pinning service API. | `/ip4/0.0.0.0/tcp/9097` |
| `CLUSTER_SWARM_PORT` | Port for peer-to-peer cluster swarm communication. | 9096 |
| `OPEN_API_PORT` | Port used by the IPFS Cluster REST API. | 9094 |
| `PINNING_SERVICE_PORT` | Port used by the pinning service API. | 9097 |
| `CLUSTER_PEERS` | Comma-separated multiaddresses of cluster peers. | |

### `CLUSTER_SECRET`

Shared secret for cluster authentication. **Must be the same on all connected nodes.**

!!! danger "Security"
Generate a unique secret for production:
`bash
    openssl rand -hex 32
    `

```env
CLUSTER_SECRET=your-32-byte-hex-secret-here
```

### `CLUSTER_PEERNAME`

Human-readable name for this cluster peer.

```env
CLUSTER_PEERNAME=node-1
```

### `CLUSTER_REPLICATION_MIN`

Minimum number of nodes that should pin each item.

```env
CLUSTER_REPLICATION_MIN=2
```

### `CLUSTER_REPLICATION_MAX`

Maximum number of nodes that should pin each item.

```env
CLUSTER_REPLICATION_MAX=3
```

### Multi-Peer Cluster Configuration

For deployments running more than one local cluster peer (e.g. `cluster0` and `cluster1`), each peer gets its own indexed set of variables:

| Variable | Description | Default |
|---|---|---|
| `CLUSTER_PEERNAME_0` | Human-readable name for the first cluster peer. | `cluster0` |
| `CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0` | Multiaddress of the first peer's IPFS daemon. | `/dns4/ipfs0/tcp/5001` |
| `CLUSTER_CRDT_TRUSTEDPEERS_0` | CRDT trusted peers for cluster consensus. `"*"` allows all. | `"*"` |
| `CLUSTER_PEERNAME_1` | Name for the second cluster peer. | `cluster1` |
| `CLUSTER_IPFSHTTP_NODEMULTIADDRESS_1` | Multiaddress of the second peer's IPFS daemon. | `/dns4/ipfs1/tcp/5001` |
| `CLUSTER_CRDT_TRUSTEDPEERS_1` | CRDT trusted peers for this peer. | `"*"` |
| `OPEN_API_PORT_1` | REST API port for cluster 1. | 9194 |
| `PINNING_SERVICE_PORT_1` | Pinning service port for cluster 1. | 9197 |

---

## AI Settings

### `DISABLE_ALL_AI_FUNCTIONALITY`

Completely disable AI features.

```env
# Enable AI (default)
DISABLE_ALL_AI_FUNCTIONALITY=false

# Disable AI
DISABLE_ALL_AI_FUNCTIONALITY=true
```

### `OLLAMA_MODEL`

Default LLM model for AI analysis.

| Model         | Size   | Quality | Speed  |
| ------------- | ------ | ------- | ------ |
| `tinyllama`   | 637 MB | Basic   | Fast   |
| `phi3`        | 2.2 GB | Good    | Medium |
| `llama3.2:3b` | 2.0 GB | Good    | Medium |
| `llama3.2:7b` | 4.7 GB | Better  | Slower |
| `mistral`     | 4.1 GB | Better  | Slower |

```env
OLLAMA_MODEL=llama3.2:3b
```

### `OLLAMA_HOST`

Ollama API host (if running separately).

```env
OLLAMA_HOST=http://localhost:11434
```

### `OLLAMA_GPU`

Enable GPU acceleration.

```env
# Auto-detect (default)
OLLAMA_GPU=auto

# Force CPU
OLLAMA_GPU=cpu
```

### `AUTO_DOWNLOAD`

Whether to automatically download the configured model's weights on startup.

```env
AUTO_DOWNLOAD=true
```

---

## Open Web UI Settings

TruSpace provisions and talks to an [Open Web UI](https://openwebui.com) instance for the AI chat interface and RAG capabilities.

| Variable | Description | Default | Required |
|---|---|---|---|
| `OPENWEBUI_HOST` | URL of the Open Web UI instance. | `http://webui:8080` | true |
| `OPEN_WEBUI_PORT` | Port where Open Web UI listens. | 3333 | true |
| `ADMIN_USER_EMAIL` | Default admin user email for Open Web UI. | `admin@example.com` | true |
| `ADMIN_USER_PASSWORD` | Default admin password. **Change this in production!** | `admin` | true |
| `WEBUI_SECRET_KEY` | Secret key for Open Web UI session security. | `t0p-s3cr3t` | true |

!!! danger "Security"
    Always change `ADMIN_USER_PASSWORD` and `WEBUI_SECRET_KEY` from their defaults before exposing TruSpace beyond `localhost`.

---

## Security Settings

### `MASTER_PASSWORD`

Password used for encryption of stored workspace passwords. Set to a strong, unique value in production — the wizard rejects the default `Kennwort123`.

```env
MASTER_PASSWORD=<a-strong-unique-password>
```

### `JWT_SECRET`

Secret key for JWT token signing.

!!! danger "Security"
Generate a unique secret for production:
`bash
    openssl rand -hex 64
    `

```env
JWT_SECRET=your-very-long-secret-key-here
```

### `JWT_EXPIRY`

JWT token expiration time.

```env
JWT_EXPIRY=24h
```

### `BCRYPT_ROUNDS`

Number of bcrypt hashing rounds.

```env
BCRYPT_ROUNDS=12
```

### `REQUIRE_STRICT_PASSWORDS`

Controls whether passwords set during registration and password reset must meet
strong-password rules on the frontend. When enabled, passwords must be at least
12 characters long and contain at least one uppercase letter, one number, and
one special character.

| Value   | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| `true`  | Enforce strong-password rules (default, recommended for production) |
| `false` | Allow any non-empty password (useful for local development/testing) |

```env
# Enforce strong passwords (default)
REQUIRE_STRICT_PASSWORDS=true

# Allow any password
REQUIRE_STRICT_PASSWORDS=false
```

!!! note
This flag is consumed at frontend build time. When using pre-built images
(`BUILD_OR_PULL_IMAGES=pull`), the value baked into the published image
applies. When building locally (`BUILD_OR_PULL_IMAGES=build`) or running the
frontend in dev mode (`npm run dev` inside `frontend/`), the current `.env`
value is used.

---

## Email Settings

TruSpace uses SMTP to send transactional emails such as password resets and, optionally, registration confirmation emails.

!!! note
Email settings are optional. If not configured, password reset and user activation emails will not be sent.

### `SMTP_HOST`

Address of the SMTP server.

```env
SMTP_HOST=smtp.example.com
```

### `SMTP_PORT`

Port used to connect to the SMTP server.

| Port  | Typical use                                            |
| ----- | ------------------------------------------------------ |
| `465` | SMTP over SSL (`SMTP_SSL=true`)                        |
| `587` | SMTP with STARTTLS (`SMTP_TLS=true`, `SMTP_SSL=false`) |
| `25`  | Unencrypted (not recommended)                          |

```env
SMTP_PORT=587
```

### `SMTP_USER`

Username for authenticating with the SMTP server.

```env
SMTP_USER=noreply@example.com
```

### `SMTP_PASSWORD`

Password for authenticating with the SMTP server.

!!! danger "Security"
Never commit this value to version control. Use a dedicated app password or service account credential.

```env
SMTP_PASSWORD=your-smtp-password
```

### `SMTP_SSL`

Enable SSL/TLS from the start of the connection (typically used on port 465).

```env
# Enable SSL (port 465)
SMTP_SSL=true

# Disable SSL — use with SMTP_TLS=true on port 587
SMTP_SSL=false
```

### `SMTP_TLS`

Upgrade an initially unencrypted connection to TLS using STARTTLS (typically on port 587). Set `SMTP_SSL=false` when using this option.

```env
SMTP_TLS=true
```

### `EMAIL_SENDER`

The email address that appears as the sender in outgoing notification and system emails.

```env
EMAIL_SENDER=noreply@example.com
```

### `REGISTER_USERS_AS_INACTIVE`

When set to `true`, newly registered users are created as inactive and must confirm their email address before they can log in. Requires SMTP to be configured.

```env
# Require email confirmation on registration
REGISTER_USERS_AS_INACTIVE=true

# Allow immediate login after registration (default)
REGISTER_USERS_AS_INACTIVE=false
```

---

## Build Settings

### `BUILD_OR_PULL_IMAGES`

Whether to build images locally or pull from registry.

| Value   | Description                             |
| ------- | --------------------------------------- |
| `pull`  | Pull pre-built images (default, faster) |
| `build` | Build images locally                    |

```env
BUILD_OR_PULL_IMAGES=pull
```

---

## Example Configurations

### Local Development

```env title=".env"
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
FRONTEND_PORT=3000
BACKEND_PORT=8000
OLLAMA_MODEL=tinyllama
```

### Production

```env title=".env"
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://truspace.example.com
FRONTEND_PORT=3000
BACKEND_PORT=8000
JWT_SECRET=<generated-secret>
CLUSTER_SECRET=<generated-secret>
OLLAMA_MODEL=llama3.2:7b
BUILD_OR_PULL_IMAGES=pull
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<smtp-password>
SMTP_SSL=false
SMTP_TLS=true
EMAIL_SENDER=noreply@example.com
REGISTER_USERS_AS_INACTIVE=true
```

### Raspberry Pi

```env title=".env"
NODE_ENV=production
LOG_LEVEL=info
IPFS_PROFILE=lowpower
DISABLE_ALL_AI_FUNCTIONALITY=true
CORS_ORIGIN=http://raspberrypi.local:3000
```

---

## Applying Changes

After modifying `.env`:

```bash
# Restart services
docker compose down
docker compose up -d

# Or use start.sh
./start.sh
```

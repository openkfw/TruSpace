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

| Category | Variables |
|----------|-----------|
| [Core](#core-settings) | `NODE_ENV`, `LOG_LEVEL` |
| [Network](#network-settings) | `CORS_ORIGIN`, `FRONTEND_PORT`, `BACKEND_PORT` |
| [IPFS](#ipfs-settings) | `IPFS_*`, `CLUSTER_*` |
| [AI](#ai-settings) | `OLLAMA_*`, `DISABLE_ALL_AI_FUNCTIONALITY` |
| [Security](#security-settings) | `JWT_SECRET`, `CLUSTER_SECRET` |

---

## Core Settings

### `NODE_ENV`

Application environment mode.

| Value | Description |
|-------|-------------|
| `development` | Development mode with verbose logging |
| `production` | Production mode with optimized settings |

```env
NODE_ENV=production
```

### `LOG_LEVEL`

Logging verbosity level.

| Value | Description |
|-------|-------------|
| `debug` | All messages including debug |
| `info` | Informational messages and above |
| `warn` | Warnings and errors only |
| `error` | Errors only |

```env
LOG_LEVEL=info
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

## IPFS Settings

### `IPFS_PROFILE`

IPFS configuration profile.

| Value | Description |
|-------|-------------|
| `server` | Optimized for servers (default) |
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

---

## IPFS Cluster Settings

### `CLUSTER_SECRET`

Shared secret for cluster authentication. **Must be the same on all connected nodes.**

!!! danger "Security"
    Generate a unique secret for production:
    ```bash
    openssl rand -hex 32
    ```

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

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| `tinyllama` | 637 MB | Basic | Fast |
| `phi3` | 2.2 GB | Good | Medium |
| `llama3.2:3b` | 2.0 GB | Good | Medium |
| `llama3.2:7b` | 4.7 GB | Better | Slower |
| `mistral` | 4.1 GB | Better | Slower |

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

---

## Security Settings

### `JWT_SECRET`

Secret key for JWT token signing.

!!! danger "Security"
    Generate a unique secret for production:
    ```bash
    openssl rand -hex 64
    ```

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

---

## Build Settings

### `BUILD_OR_PULL_IMAGES`

Whether to build images locally or pull from registry.

| Value | Description |
|-------|-------------|
| `pull` | Pull pre-built images (default, faster) |
| `build` | Build images locally |

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

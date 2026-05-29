---
title: Logging
description: How logging works in TruSpace — configuration, log levels, and accessing logs
icon: material/text-box-search
tags:
  - logging
  - developer
  - debugging
---

# Logging

TruSpace uses [Winston](https://github.com/winstonjs/winston) as its logging library. The configuration lives in `backend/src/config/winston.ts`.

---

## Log Levels

Control verbosity via the `LOG_LEVEL` environment variable in your `.env` file:

| Value | Description |
|---|---|
| `DEBUG` | All messages, including detailed debug output. Default for development. |
| `INFO` | Informational messages and above — recommended for staging. |
| `WARN` | Warnings and errors only. |
| `ERROR` | Errors only — minimal output. |
| `NONE` | Disables logging entirely. |

```env
LOG_LEVEL=DEBUG
```

!!! tip "Production recommendation"
    Use `LOG_LEVEL=INFO` or `LOG_LEVEL=WARN` in production to reduce noise and storage usage. Switch to `DEBUG` temporarily when diagnosing a specific issue.

---

## Accessing Container Logs

### View logs for a specific container

```bash
docker logs <container_name>
```

Replace `<container_name>` with one of:

| Container | Purpose |
|---|---|
| `truspace-backend` | Express API — most application logs |
| `frontend` | Next.js frontend — SSR and fetch errors |
| `ipfs0` | IPFS node — swarm and storage events |
| `cluster0` | IPFS Cluster — pinning and peer events |
| `webui` | Open Web UI — AI interface logs |
| `ollama` | Ollama — model loading and inference |

### Find a container ID

```bash
docker ps
```

### Follow logs in real time

```bash
docker logs -f truspace-backend
```

### View all services at once

```bash
docker compose logs -f
```

### Filter by time

```bash
# Logs from the last 30 minutes
docker logs --since 30m truspace-backend

# Logs since a specific timestamp
docker logs --since "2025-01-15T10:00:00" truspace-backend
```

---

## Log Output Format

Winston outputs structured logs. In development (`DEBUG` level), you'll see coloured, human-readable output. In production, logs are plain text suitable for log aggregation tools.

Example output:

```
2025-01-15 10:23:45 [INFO]  Server started on port 8000
2025-01-15 10:23:46 [DEBUG] IPFS connection established: /ip4/127.0.0.1/tcp/5001
2025-01-15 10:24:01 [INFO]  POST /api/documents 201 142ms
2025-01-15 10:24:05 [ERROR] Failed to pin CID QmXyz: timeout after 30s
```

---

## Related

- [Environment Variables — LOG_LEVEL](../../configuration/environment-variables.md#log_level) — full reference for the `LOG_LEVEL` variable
- [Troubleshooting](../../reference/troubleshooting.md) — how to use logs to diagnose common issues

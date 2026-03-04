---
title: CLI Reference
description: Command-line tools
icon: material/console
---

# CLI Reference

Command-line tools and scripts.

## start.sh

Main startup script.

```bash
./start.sh [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--dev` | Development mode |
| `--no-ai` | Disable AI |
| `--local-frontend` | Run frontend locally |
| `--remove-peers` | Remove bootstrap peers |

## Connection Scripts

### fetch-connection.sh

Generate connection details.

```bash
./scripts/fetch-connection.sh [-e]
```

| Option | Description |
|--------|-------------|
| `-e` | Encrypt output |

### connectPeer-automatic.sh

Connect to another node.

```bash
./scripts/connectPeer-automatic.sh <connection_file> <password_file>
```

## Docker Commands

Common Docker operations:

```bash
# View logs
docker compose logs -f

# Restart service
docker compose restart <service>

# Stop all
docker compose down

# Remove data
docker compose down -v
```

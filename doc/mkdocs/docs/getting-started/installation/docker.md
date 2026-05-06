---
title: Docker Deployment
description: Standard Docker-based TruSpace deployment
icon: material/docker
tags:
  - installation
  - docker
  - deployment
---

# Docker Deployment

The standard way to deploy TruSpace using Docker Compose.

## Prerequisites

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**
- 4 GB RAM minimum (8 GB recommended with AI features)

## Installation

```bash
# Clone repository (HTTPS)
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace

# Start TruSpace
./start.sh
```

On the **first run**, `./start.sh` detects that no `.env` file exists and launches the interactive configuration wizard before starting the containers. The wizard asks you to choose a deployment profile and prompts for the values specific to your setup — you can press ENTER to accept the defaults for everything else.

Once configured, TruSpace is available at [http://localhost:3000](http://localhost:3000) (or whatever domain and port you chose).

## Configuration

### Interactive wizard (recommended)

The wizard is the standard way to create or update the `.env` file:

```bash
# Runs automatically on first start, or explicitly at any time:
./start.sh --configure-env
# or directly:
./scripts/configure-env.sh
```

The wizard walks you through a deployment profile selection and then prompts for the values relevant to that profile:

| Profile        | Use case                                                           |
| -------------- | ------------------------------------------------------------------ |
| `local-dev`    | Developing on this machine (localhost, http, relaxed security)     |
| `local-server` | LAN/home server with a hostname or IP, accessed over http directly |
| `production`   | Internet-facing server with https and a reverse proxy              |
| `custom`       | Configure all settings manually                                    |

### Manual `.env` editing

You can also edit the generated `.env` file directly at any time — run `./start.sh --configure-env` once to generate it, then open it in your editor. All variables are documented with inline comments.

## `start.sh` Flags

| Flag               | Effect                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| _(none)_           | Configure (if no `.env`), then start all services                                 |
| `--configure-env`  | Re-run the configuration wizard, then start                                       |
| `--no-ai`          | Disable Ollama and Open WebUI (equivalent to `DISABLE_ALL_AI_FUNCTIONALITY=true`) |
| `--dev`            | Build images locally instead of pulling; run frontend in dev mode                 |
| `--local-frontend` | Run the Next.js frontend locally (outside Docker) instead of in a container       |
| `--remove-peers`   | Remove default IPFS bootstrap peers after startup (for private networks)          |

## Docker Compose Files

TruSpace assembles its Docker Compose setup from several files:

| File                          | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `docker-compose.yml`          | Core services: IPFS node (`ipfs0`), Cluster (`cluster0`), backend |
| `docker-compose-frontend.yml` | Frontend service                                                  |
| `docker-compose-ai.yml`       | AI services: Ollama, Open WebUI                                   |
| `docker-compose.build.yml`    | Overrides for building images locally                             |
| `docker-compose.pull.yml`     | Overrides for pulling pre-built images                            |

`start.sh` selects the right combination automatically based on your `.env` and flags.

### Starting specific services

=== "All services"

    ```bash
    ./start.sh
    ```

=== "Without AI"

    ```bash
    ./start.sh --no-ai
    ```

=== "Core infrastructure only"

    ```bash
    docker compose up ipfs0 cluster0 -d
    ```

## Container Management

### View running containers

```bash
docker ps
```

### View logs

```bash
# Follow all container logs
docker compose logs -f

# Follow a specific container
docker compose logs -f backend
docker compose logs -f ipfs0
```

### Restart services

```bash
# Restart all
docker compose restart

# Restart one service
docker compose restart backend
```

### Stop services

```bash
# Stop all containers, keep data
docker compose down

# Stop and delete all data volumes (⚠️ irreversible)
docker compose down -v
```

## Data Persistence

TruSpace stores all persistent data in a `./volumes/` directory inside the project folder using **bind mounts** — not named Docker volumes. This makes the data easy to inspect, back up, and restore.

| Path                  | Contents                                        |
| --------------------- | ----------------------------------------------- |
| `./volumes/ipfs0/`    | IPFS (Kubo) datastore and config                |
| `./volumes/cluster0/` | IPFS Cluster config (`service.json`, peer keys) |
| `./volumes/db/`       | SQLite database (`truspace.db`)                 |
| `./volumes/ollama/`   | Downloaded AI models                            |

### Backup

Stop TruSpace first to ensure the database is not mid-write, then copy the volumes directory and your `.env`:

```bash
docker compose down

# Backup all data and configuration
tar czf truspace-backup-$(date +%Y%m%d).tar.gz ./volumes .env

docker compose up -d
```

### Restore

```bash
docker compose down

# Remove current data
rm -rf ./volumes

# Restore from backup archive
tar xzf truspace-backup-<date>.tar.gz

# Fix ownership if needed (containers run as UID 1000)
sudo chown -R 1000:1000 ./volumes

docker compose up -d
```

## Updating TruSpace

```bash
# Pull the latest source
git pull origin main

docker compose down
```

=== "If BUILD_OR_PULL_IMAGES=pull (default for production)"

    ```bash
    # Pull updated images and restart
    docker compose pull
    ./start.sh
    ```

=== "If BUILD_OR_PULL_IMAGES=build (default for dev)"

    ```bash
    # Rebuild from source and restart
    docker compose build --no-cache
    ./start.sh
    ```

!!! warning "Database migrations"
If an update includes schema changes, you may need to delete `./volumes/db/truspace.db` to let the backend recreate it. Check the release notes before upgrading.

## Resource Limits

For constrained environments, create a `docker-compose.override.yml` in the project root:

```yaml
version: "3.8"
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M

  ipfs0:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 1G

  ollama:
    deploy:
      resources:
        limits:
          cpus: "4"
          memory: 4G
```

## Health Checks

TruSpace exposes a unified health endpoint through the backend that reports the status of all internal services:

```bash
# Via the frontend proxy (production / local-server)
curl http://<your-domain>/health

# Direct backend check (local-dev)
curl http://localhost:8000/health

# IPFS node identity check
curl http://localhost:5001/api/v0/id

# IPFS Cluster status
docker exec cluster0 ipfs-cluster-ctl status
```

The `/health` endpoint is also what drives the status indicators in the top-right corner of the TruSpace UI.

## Troubleshooting

### Container won't start

```bash
# Check what went wrong
docker compose logs <service-name>

# Check host resource usage
docker stats
```

### Network issues between containers

```bash
# Inspect the Docker network
docker network inspect truspace_default

# Recreate the network
docker compose down
docker network prune
docker compose up -d
```

### Volume permission errors

Containers run as UID 1000. If you see permission-denied errors in the logs:

```bash
sudo chown -R 1000:1000 ./volumes
```

### Database errors after an update

If the backend fails to start with a migration error, the schema may have changed incompatibly:

```bash
# ⚠️ This deletes all user accounts and workspace metadata
rm ./volumes/db/truspace.db
docker compose restart backend
```

Documents stored in IPFS are unaffected by a database reset.

## Next Steps

- [:octicons-arrow-right-24: Environment Variables](../../configuration/environment-variables.md)
- [:octicons-arrow-right-24: Network Configuration](../../configuration/network.md)
- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)

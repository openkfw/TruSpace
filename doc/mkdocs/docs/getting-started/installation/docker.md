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
- 4 GB RAM minimum (8 GB recommended with AI)

## Quick Installation

```bash
# Clone repository
git clone git@github.com:openkfw/TruSpace.git
cd TruSpace

# Start TruSpace
./start.sh
```

That's it! TruSpace will be available at [http://localhost:3000](http://localhost:3000).

## Custom Configuration

### Using Environment Variables

```bash
# Copy and edit environment file
cp .env.example .env
nano .env  # or your preferred editor

# Then start
./start.sh
```

### Interactive Configuration

Use the configuration script for guided setup:

```bash
./scripts/configure-env.sh
```

This will prompt you for:

- Domain configuration
- Port settings
- AI model selection
- CORS origins

## Docker Compose Files

TruSpace uses multiple compose files:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Core services (IPFS, backend) |
| `docker-compose-frontend.yml` | Frontend service |
| `docker-compose-ai.yml` | AI services (Ollama, Open Web UI) |
| `docker-compose.build.yml` | Local image building |
| `docker-compose.pull.yml` | Pre-built images |

### Starting Specific Services

=== "All Services"

    ```bash
    ./start.sh
    ```

=== "Without AI"

    ```bash
    ./start.sh --no-ai
    ```

=== "Only Infrastructure"

    ```bash
    docker compose up ipfs0 cluster0 -d
    ```

## Container Management

### View Running Containers

```bash
docker ps
```

### View Logs

```bash
# All containers
docker compose logs -f

# Specific container
docker compose logs -f backend
docker compose logs -f ipfs0
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services

```bash
# Stop all (keep data)
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

## Data Persistence

TruSpace stores data in Docker volumes:

| Volume | Purpose |
|--------|---------|
| `truspace_ipfs_data` | IPFS datastore |
| `truspace_cluster_data` | IPFS Cluster config |
| `truspace_sqlite_data` | SQLite database |
| `truspace_ollama_data` | AI models |

### Backup Volumes

```bash
# Backup IPFS data
docker run --rm -v truspace_ipfs_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/ipfs-backup.tar.gz -C /data .

# Backup SQLite
docker run --rm -v truspace_sqlite_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/sqlite-backup.tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore IPFS data
docker run --rm -v truspace_ipfs_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/ipfs-backup.tar.gz -C /data
```

## Updating TruSpace

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
./start.sh
```

## Resource Limits

For constrained environments, you can limit container resources in a `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
  
  ipfs0:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
  
  ollama:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
```

## Health Checks

Check service health:

```bash
# Backend health
curl http://localhost:8000/health

# IPFS health
curl http://localhost:5001/api/v0/id

# Frontend health
curl http://localhost:3000
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check resource usage
docker stats
```

### Network Issues

```bash
# Inspect network
docker network inspect truspace_default

# Recreate network
docker compose down
docker network prune
docker compose up -d
```

### Permission Issues

```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data
```

## Next Steps

- [:octicons-arrow-right-24: Environment Variables](../../configuration/environment-variables.md)
- [:octicons-arrow-right-24: Network Configuration](../../configuration/network.md)
- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)

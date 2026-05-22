---
title: Maintenance
description: Keeping TruSpace healthy — updates, monitoring, log rotation, and security patches
icon: material/wrench-clock
tags:
  - admin
  - maintenance
  - updates
  - monitoring
---

# Maintenance

Regular maintenance keeps TruSpace secure, stable, and performing well. This page covers updates, monitoring, log management, and security patching.

---

## Monitoring

### Health Endpoint

TruSpace exposes a built-in health endpoint that checks all major service components:

```bash
curl http://<your_truspace_domain>/health
```

The `/health` endpoint reports the status of:

| Component | What it checks |
|---|---|
| Backend | Express API responsiveness |
| Database | SQLite accessibility |
| IPFS Cluster | Cluster service availability |
| IPFS Pinning Service | Pinning API availability |
| IPFS Gateway | Content gateway availability |
| Open Web UI | AI interface availability |
| Ollama | LLM engine availability |

The same status signals are shown as coloured indicators in the top-right corner of the TruSpace web interface.

### Container Resource Usage

```bash
# Live resource stats for all containers
docker stats

# Full system summary (images, volumes, containers)
docker system df
```

### Automated Health Check (cron)

Add a cron job to alert or restart on health failure:

```bash
crontab -e
```

```cron
*/5 * * * * curl -sf http://localhost:8000/health || docker compose -f /opt/TruSpace/docker-compose.yml restart
```

### Log Monitoring

Stream logs in real time:

```bash
# All services
docker compose logs -f

# Specific service
docker logs -f truspace-backend
```

For structured log aggregation, configure the Docker JSON log driver with rotation (see Log Rotation below).

---

## Updates

!!! warning "Back up before updating"
    Always back up your data before pulling a new version. See the [Backup & Recovery](backup-recovery.md) guide.

### Standard Update

```bash
# 1. Pull latest source
cd /opt/TruSpace
git pull origin main

# 2. Stop running containers
docker compose down

# 3. Pull updated images
docker compose pull

# 4. Restart
./start.sh
```

### Update Script (automated)

Save as `/opt/TruSpace/update.sh`:

```bash
#!/bin/bash
set -e
cd /opt/TruSpace

echo "Backing up database..."
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/sqlite-pre-update-$(date +%Y%m%d%H%M).tar.gz -C /data .

echo "Pulling latest changes..."
git pull origin main

echo "Restarting containers..."
docker compose down
docker compose pull
./start.sh

echo "Update complete."
```

```bash
chmod +x /opt/TruSpace/update.sh
```

### Post-Update Checks

After any update:

1. Open the web interface and verify login works
2. Check the health endpoint: `curl http://localhost:8000/health`
3. Upload a test document and confirm AI processing (if enabled)
4. Review container logs for errors: `docker compose logs`

---

## Security Patches

### Checking for Vulnerabilities

```bash
# From any package directory (backend, frontend, e2e-tests)
cd backend && npm audit
cd ../frontend && npm audit
```

### Applying Fixes

```bash
# Auto-fix non-breaking updates
npm audit fix

# Force-fix breaking updates (test thoroughly after)
npm audit fix --force
```

After patching npm packages:

```bash
# Clear caches to ensure clean install
rm -rf node_modules/ .next/
npm install

# Verify types build cleanly
npm run build
```

Open a dedicated pull request for dependency updates — see the [Contributing guide](../../guides/developer/contributing.md#security-fixes--dependency-updates) for the full workflow.

### Docker Image Security

Docker image vulnerabilities are scanned automatically in CI via **Trivy** on every build. For manual scans on your running deployment:

```bash
# Scan a specific image
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image truspace-backend:latest
```

---

## Log Rotation

Prevent unbounded log growth by configuring Docker's JSON log driver:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

For application-level log files (if writing to disk):

```bash
sudo nano /etc/logrotate.d/truspace
```

```
/opt/TruSpace/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## Cleaning Up Docker Resources

Over time, unused images, stopped containers, and dangling volumes accumulate:

```bash
# Remove stopped containers, unused networks, dangling images and build cache
docker system prune -f

# Also remove unused volumes (caution: ensure backups exist first)
docker system prune --volumes -f

# Remove only dangling images
docker image prune -f
```

---

## Related

- [:octicons-arrow-right-24: Backup & Recovery](backup-recovery.md) — back up before every update
- [:octicons-arrow-right-24: Troubleshooting](../../reference/troubleshooting.md) — diagnosing issues after updates
- [:octicons-arrow-right-24: Logging](../../guides/developer/logging.md) — understanding log output

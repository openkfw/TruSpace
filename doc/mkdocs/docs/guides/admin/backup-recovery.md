---
title: Backup & Recovery
description: Backup and restore TruSpace data
icon: material/backup-restore
tags:
  - backup
  - recovery
  - administration
---

# Backup & Recovery

Protect your TruSpace data with regular backups.

## What to Backup

| Data | Location | Priority |
|------|----------|----------|
| SQLite DB | Docker volume | Critical |
| IPFS Data | Docker volume | High |
| Configuration | `.env` file | High |
| Cluster Config | Docker volume | Medium |

## Backup Commands

### SQLite Database

```bash
# Create backup
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/sqlite-$(date +%Y%m%d).tar.gz -C /data .
```

### IPFS Data

```bash
# Create backup (can be large)
docker run --rm \
  -v truspace_ipfs_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/ipfs-$(date +%Y%m%d).tar.gz -C /data .
```

### Configuration

```bash
cp .env backups/.env.$(date +%Y%m%d)
```

## Restore Procedure

### 1. Stop Services

```bash
docker compose down
```

### 2. Restore SQLite

```bash
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/sqlite-YYYYMMDD.tar.gz -C /data
```

### 3. Restore Configuration

```bash
cp backups/.env.YYYYMMDD .env
```

### 4. Start Services

```bash
./start.sh
```

## Automated Backups

Create a cron job for daily backups:

```bash
# Add to crontab
0 2 * * * /opt/TruSpace/backup.sh
```

## Disaster Recovery

If a node is lost:

1. Set up new TruSpace instance
2. Restore SQLite backup
3. Connect to existing network peers
4. Data will sync from peers

---
title: Backup & Recovery
description: Backup strategy, restore procedures, and disaster recovery for TruSpace
icon: material/backup-restore
tags:
  - backup
  - recovery
  - admin
---

# Backup & Recovery

Regular backups protect against data loss from hardware failure, accidental deletion, or failed updates. This page covers what to back up, how to do it, and how to restore.

---

## What to Back Up

| Data | Location | Priority | Notes |
|---|---|---|---|
| SQLite database | Docker volume `truspace_sqlite_data` | **Critical** | Users, sessions, metadata |
| Environment config | `.env` file in project root | **Critical** | All secrets and settings |
| IPFS data | Docker volume `truspace_ipfs_data` | High | Document content (large) |
| IPFS Cluster config | Docker volume `truspace_cluster_data` | Medium | Peer and pin state |
| `/volumes` directory | Project root | High | All persistent data combined |

!!! tip "Minimum viable backup"
    At minimum, back up the `volumes/` directory and your `.env` file. These two together are sufficient to fully restore a TruSpace instance.

---

## Backup Commands

### SQLite Database

```bash
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/sqlite-$(date +%Y%m%d).tar.gz -C /data .
```

### IPFS Data

```bash
# Note: can be large depending on how many documents are stored
docker run --rm \
  -v truspace_ipfs_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/ipfs-$(date +%Y%m%d).tar.gz -C /data .
```

### Environment Configuration

```bash
cp .env backups/.env.$(date +%Y%m%d)
```

### Full `/volumes` Directory

```bash
tar czf backups/volumes-$(date +%Y%m%d).tar.gz ./volumes/
```

---

## Automated Daily Backups

Save as `/opt/TruSpace/backup.sh`:

```bash
#!/bin/bash
set -e
BACKUP_DIR=/backups/truspace
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

echo "Backing up SQLite..."
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/sqlite-$DATE.tar.gz" -C /data .

echo "Backing up .env..."
cp /opt/TruSpace/.env "$BACKUP_DIR/.env.$DATE"

# Optional: uncomment to back up IPFS data (can be large)
# echo "Backing up IPFS..."
# docker run --rm \
#   -v truspace_ipfs_data:/data \
#   -v "$BACKUP_DIR":/backup \
#   alpine tar czf "/backup/ipfs-$DATE.tar.gz" -C /data .

# Keep last 7 days only
find "$BACKUP_DIR" -mtime +7 -delete

echo "Backup complete: $BACKUP_DIR"
```

```bash
chmod +x /opt/TruSpace/backup.sh

# Schedule daily at 02:00
(crontab -l; echo "0 2 * * * /opt/TruSpace/backup.sh") | crontab -
```

---

## Restore Procedure

### 1. Stop Running Services

```bash
docker compose down
```

### 2. Restore the SQLite Database

```bash
docker run --rm \
  -v truspace_sqlite_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/sqlite-YYYYMMDD.tar.gz -C /data
```

### 3. Restore the `/volumes` Directory (if backed up as a whole)

```bash
tar xzf backups/volumes-YYYYMMDD.tar.gz -C .
```

Fix permissions after restore:

```bash
sudo chown -R 1000:1000 ./volumes
# or if that doesn't match your user
sudo chmod -R 744 ./volumes
```

### 4. Restore Environment Configuration

```bash
cp backups/.env.YYYYMMDD .env
```

### 5. Start TruSpace

```bash
./start.sh
```

### 6. Verify

- Open the web interface and log in
- Check that workspaces and documents are visible
- Run: `curl http://localhost:8000/health`

---

## Disaster Recovery (Node Loss)

If a node is lost entirely and no local backup exists, data may be recoverable from peer nodes if the IPFS cluster had replication enabled:

1. Set up a fresh TruSpace installation
2. Restore the SQLite backup (users and metadata)
3. Restore the `.env` with the original `CLUSTER_SECRET` and `CLUSTER_PEERNAME`
4. Connect to the existing peer nodes using the [node connection guide](connecting-nodes.md)
5. The IPFS Cluster will re-sync pinned content from peers automatically

!!! warning "No peers = no recovery"
    If no peer nodes are available and no backup exists, document content stored only in IPFS cannot be recovered. Always maintain at least one backup and/or one connected peer.

---

## Related

- [:octicons-arrow-right-24: Maintenance](maintenance.md) — automated update and backup scripts
- [:octicons-arrow-right-24: Connecting Nodes](connecting-nodes.md) — re-connect after recovery
- [:octicons-arrow-right-24: Troubleshooting](../../reference/troubleshooting.md) — diagnosing issues after restore

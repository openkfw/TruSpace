---
title: Workspace Management
description: Administering workspaces
icon: material/folder-cog
---

# Workspace Management

Administrative tasks for workspaces.

## Viewing All Workspaces

Administrators can view all workspaces regardless of visibility.

## Workspace Cleanup

### Delete Empty Workspaces

Access workspace settings and delete if empty.

### Transfer Ownership

1. Open workspace settings
2. Change owner
3. Confirm transfer

## Storage Management

Monitor workspace storage usage:

```bash
docker exec ipfs0 ipfs repo stat
```

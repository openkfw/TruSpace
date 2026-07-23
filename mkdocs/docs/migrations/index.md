---
title: Migrations
description: Version-specific migration scripts and upgrade hints for TruSpace deployments
icon: material/arrow-up-bold-box
---

# Migrations

This section contains version-specific migration scripts and upgrade hints for existing TruSpace deployments.

Before applying any migration:

1. Back up the database and persistent volumes. See [Backup & Recovery](../guides/admin/backup-recovery.md).
2. Check the migration notes for the target version.
3. Stop the running deployment before changing persistent data or images.
4. Run the post-update checks in the [Maintenance guide](../guides/admin/maintenance.md#post-update-checks).

!!! warning
    Migration steps may be destructive. Do not delete a persistent volume unless the corresponding migration note explicitly says to do so and the data has been backed up.

## Version index

- [Version 1.0](1.0.md)

New version-specific migration pages should be added here as releases require scripts or special upgrade steps.

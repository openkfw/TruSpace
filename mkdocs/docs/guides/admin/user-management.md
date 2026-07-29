---
title: User Management
description: Managing TruSpace users
icon: material/account-group
---

# User Management

Administering users in TruSpace.

## Creating Users

Users self-register through the web interface. Administrators can:

- View all users
- Modify user roles
- Disable accounts

## User Roles

| Role | Capabilities |
|------|--------------|
| User | Create workspaces, upload documents |
| Admin | Full system access |

## Database Access

For direct database operations:

```bash
docker exec -it truspace-backend-1 sqlite3 /data/truspace.db
```

### List Users

```sql
SELECT id, username, email, created_at FROM users;
```

### Change Password

Use the application interface or reset via backend.

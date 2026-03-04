---
title: API Reference
description: TruSpace Backend API
icon: material/api
---

# API Reference

TruSpace backend REST API documentation.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most endpoints require JWT authentication:

```
Authorization: Bearer <token>
```

## Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |

### Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces` | List workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace |
| PUT | `/workspaces/:id` | Update workspace |
| DELETE | `/workspaces/:id` | Delete workspace |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:id/documents` | List documents |
| POST | `/workspaces/:id/documents` | Upload document |
| GET | `/documents/:id` | Get document |
| DELETE | `/documents/:id` | Delete document |

## Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

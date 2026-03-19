---
title: Data Types
description: TypeScript interfaces and types
icon: material/code-json
---

# Data Types

TypeScript interfaces used in TruSpace.

## User

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  ownerId: string;
  createdAt: Date;
}
```

## Document

```typescript
interface Document {
  id: string;
  workspaceId: string;
  name: string;
  cid: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}
```

## AI Perspective

```typescript
interface AIPerspective {
  id: string;
  documentId: string;
  promptId: string;
  content: string;
  model: string;
  createdAt: Date;
}
```

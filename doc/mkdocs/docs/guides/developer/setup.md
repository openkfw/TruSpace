---
title: Development Setup
description: Set up TruSpace for development
icon: material/cog
---

# Development Setup

Get started with TruSpace development.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git
- VS Code (recommended)

## Clone Repository

```bash
git clone git@github.com:openkfw/TruSpace.git
cd TruSpace
```

## Start Development Environment

```bash
# Start infrastructure
./start.sh --local-frontend

# In new terminal, start frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
TruSpace/
├── backend/          # Express API
├── frontend/         # Next.js app
├── docker-compose.*  # Docker configs
├── scripts/          # Helper scripts
└── doc/              # Documentation
```

## VS Code Extensions

Recommended extensions:

- ESLint
- Prettier
- TypeScript
- Docker

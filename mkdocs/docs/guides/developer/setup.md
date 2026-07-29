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

The codebase is organized into several key directories, each serving a specific purpose:

```
TruSpace/
├── .github/           # GitHub-specific configuration (workflows, issue templates)
├── backend/           # Express API — backend services and routes
├── doc/               # Documentation files and guides for the project
├── e2e-tests/         # End-to-end tests for the application
├── frontend/          # Next.js app — frontend application code and assets
├── helm/              # Helm charts for deploying the application on Kubernetes
├── helper-scripts/    # Helper scripts for development and deployment
├── production/        # Production-specific setup and startup scripts
├── scripts/           # Scripts for development and deployment tasks, incl.
│                      # start, configuration, and audit scripts
├── docker-compose-files/ # Docker Compose files for local development and testing
├── .env*              # Environment variable files for different stages
│                      # (development, testing, production)
├── LICENSE            # Project license (GPL-3.0)
└── README.md          # Main project documentation and setup instructions
```

## VS Code Extensions

Recommended extensions:

- ESLint
- Prettier
- TypeScript
- Docker

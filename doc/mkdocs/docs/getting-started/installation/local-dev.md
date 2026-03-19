---
title: Local Development Setup
description: Set up TruSpace for local development with hot reload
icon: material/laptop
tags:
  - installation
  - development
  - local
---

# Local Development Setup

This guide helps you set up TruSpace for active development with hot reload capabilities.

## Prerequisites

- **Node.js** 20+ (check with `node --version`)
- **npm** 10+ or **pnpm**
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**

!!! tip "Node Version Manager"
    We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions:
    ```bash
    nvm install 20
    nvm use 20
    ```

## Step 1: Clone and Configure

```bash
# Clone the repository
git clone git@github.com:openkfw/TruSpace.git
cd TruSpace

# Copy environment configuration
cp .env.example .env
```

## Step 2: Start Infrastructure Services

Start only the backend services (IPFS, database, AI):

```bash
./start.sh --local-frontend
```

This starts:

- IPFS node and cluster
- Backend API server
- Ollama and Open Web UI (optional)

## Step 3: Start Frontend in Dev Mode

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) with hot reload.

## Step 4: (Optional) Start Backend in Dev Mode

For backend development with hot reload:

=== "Terminal 1: Infrastructure"

    ```bash
    # Start only IPFS and AI services
    docker compose up ipfs0 cluster0 ollama webui -d
    ```

=== "Terminal 2: Backend"

    ```bash
    cd backend
    npm install
    npm run dev
    ```

=== "Terminal 3: Frontend"

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Project Structure

```
TruSpace/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Entry point
│   └── package.json
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── package.json
├── docker-compose.yml      # Main compose file
├── .env.example           # Environment template
└── start.sh               # Startup script
```

## Development Workflow

### Running Tests

=== "Backend Tests"

    ```bash
    cd backend
    npm test
    npm run test:watch  # Watch mode
    ```

=== "Frontend Tests"

    ```bash
    cd frontend
    npm test
    npm run test:e2e    # E2E tests
    ```

=== "All Tests"

    ```bash
    # From root directory
    npm test
    ```

### Linting and Formatting

```bash
# Check formatting
npm run lint

# Fix formatting
npm run lint:fix

# Type checking
npm run typecheck
```

### Building for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build
```

## Debug Configuration

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend: Debug",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    },
    {
      "name": "Frontend: Debug",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

### Environment Variables for Development

Create a `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEBUG=true
```

## Common Issues

### Port Conflicts

If ports are already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Reset Docker environment
docker compose down -v
docker system prune -f
./start.sh
```

## Next Steps

- [:octicons-arrow-right-24: Contributing Guide](../../guides/developer/contributing.md)
- [:octicons-arrow-right-24: API Reference](../../guides/developer/api.md)
- [:octicons-arrow-right-24: Testing Guide](../../guides/developer/testing.md)

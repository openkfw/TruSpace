---
title: Startup Options
description: Command-line options for start.sh
icon: material/rocket-launch
tags:
  - configuration
  - startup
---

# Startup Options

Configure TruSpace behavior at startup using `start.sh` flags.

## Available Flags

| Flag | Description |
|------|-------------|
| `--dev` | Development mode - builds images locally |
| `--no-ai` | Disable AI functionality |
| `--local-frontend` | Run frontend outside Docker |
| `--remove-peers` | Remove default IPFS bootstrap peers |

## Usage Examples

### Standard Startup

```bash
./start.sh
```

### Development Mode

Build images locally instead of pulling:

```bash
./start.sh --dev
```

### Without AI Features

Faster startup, lower resource usage:

```bash
./start.sh --no-ai
```

### Local Frontend Development

For frontend hot reload:

```bash
./start.sh --local-frontend

# Then in another terminal:
cd frontend && npm run dev
```

### Private Network

Remove public IPFS bootstrap peers:

```bash
./start.sh --remove-peers
```

### Combining Flags

```bash
./start.sh --dev --no-ai --remove-peers
```

## Environment Variable Equivalents

| Flag | Environment Variable |
|------|---------------------|
| `--dev` | `BUILD_OR_PULL_IMAGES=build` |
| `--no-ai` | `DISABLE_ALL_AI_FUNCTIONALITY=true` |

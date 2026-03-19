---
title: Configuration
description: Configure your TruSpace installation
icon: material/cog
---

# Configuration

Customize TruSpace to fit your needs.

<div class="grid cards" markdown>

-   :material-file-cog:{ .lg .middle } **Environment Variables**

    ---

    Complete reference for all configuration options.

    [:octicons-arrow-right-24: Environment Variables](environment-variables.md)

-   :material-rocket-launch:{ .lg .middle } **Startup Options**

    ---

    Command-line flags for start.sh.

    [:octicons-arrow-right-24: Startup Options](startup-options.md)

-   :material-lan:{ .lg .middle } **Network Configuration**

    ---

    IPFS and networking settings.

    [:octicons-arrow-right-24: Network](network.md)

-   :material-brain:{ .lg .middle } **AI Configuration**

    ---

    Configure Ollama and AI features.

    [:octicons-arrow-right-24: AI Config](ai-config.md)

</div>

## Quick Configuration

### Interactive Setup

```bash
./scripts/configure-env.sh
```

### Manual Setup

```bash
cp .env.example .env
nano .env
```

## Configuration Priority

1. Environment variables (highest)
2. `.env` file
3. Default values (lowest)

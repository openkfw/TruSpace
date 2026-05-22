---
title: Resource Requirements
description: Minimum and recommended hardware for running TruSpace
icon: material/memory
tags:
  - admin
  - hardware
  - requirements
---

# Resource Requirements

TruSpace runs as a set of Docker containers. The resources required depend heavily on whether AI features are enabled and how many concurrent users and documents the deployment needs to support.

!!! note "Estimates in progress"
    These are initial estimates based on development and testing environments. Requirements will be refined as more production data becomes available. If you have specific workloads, monitor performance and scale accordingly.

---

## General Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2+ vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 10 GB | 100 GB |
| OS | Linux 64-bit | Ubuntu 22.04 LTS |
| Docker | 20.10+ | Latest stable |

!!! warning "RAM is the critical resource"
    The local AI model (Ollama) is the largest consumer. A `llama3.2:3b` model alone requires ~4 GB of RAM at runtime. Plan accordingly or disable AI on constrained hardware.

---

## Per-Deployment Profile

| Profile | RAM | Storage | Notes |
|---|---|---|---|
| Minimal (no AI) | 4 GB | 10 GB | `--no-ai` flag or `DISABLE_ALL_AI_FUNCTIONALITY=true` |
| Standard | 8 GB | 50 GB | Small team, lightweight model (`phi3`, `llama3.2:3b`) |
| Recommended | 16 GB | 100 GB+ | Multi-user, larger models, IPFS replication |
| Raspberry Pi | 4 GB | 32 GB SD + SSD | Pi 4/5 only, use `tinyllama` or no-AI mode |

---

## AI Model RAM Usage

| Model | Disk Size | RAM at Runtime |
|---|---|---|
| `tinyllama` | 637 MB | ~2 GB |
| `phi3` | 2.2 GB | ~4 GB |
| `llama3.2:3b` | 2.0 GB | ~4 GB |
| `llama3.2:7b` | 4.7 GB | ~8 GB |
| `mistral` | 4.1 GB | ~8 GB |

For faster AI inference, a **GPU with NVIDIA Container Toolkit** is recommended. Without a GPU, inference runs on CPU and can take minutes per document on smaller hardware.

---

## Storage Growth

IPFS stores all document versions immutably. Storage usage grows over time:

- Each uploaded document version is pinned permanently until explicitly unpinned
- Multiple connected nodes each store a copy of pinned content
- AI perspectives and metadata are also stored in IPFS

Monitor storage with:

```bash
# Total Docker volume usage
docker system df

# IPFS-specific repo stats
docker exec ipfs0 ipfs repo stat
```

---

## Container Resource Limits

For constrained environments, cap individual containers with a `docker-compose.override.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  ipfs0:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
    environment:
      - IPFS_PROFILE=lowpower

  ollama:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
```

---

## Related

- [:octicons-arrow-right-24: Installation Options](../../getting-started/installation/index.md) — choose the right deployment profile
- [:octicons-arrow-right-24: Raspberry Pi Setup](../../getting-started/installation/raspberry-pi.md) — low-power deployment guide
- [:octicons-arrow-right-24: AI Configuration](../../configuration/ai-config.md) — model selection and GPU setup
- [:octicons-arrow-right-24: Maintenance](maintenance.md) — monitoring resource usage over time

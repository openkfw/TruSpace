---
title: FAQ
description: Frequently asked questions about TruSpace
icon: material/frequently-asked-questions
tags:
  - faq
  - help
---

# Frequently Asked Questions

## General

??? question "What is TruSpace?"
    TruSpace is an AI-infused, decentralised document management system that enables collaboration while maintaining data sovereignty. It uses IPFS for distributed storage and Ollama for local AI processing.

??? question "Is TruSpace free?"
    Yes — TruSpace is 100% open-source under the GPL-3.0 licence. You can use, modify, and distribute it freely.

??? question "Where is my data stored?"
    Your data is stored locally on your server in:

    - **SQLite database** — user credentials and metadata
    - **IPFS** — documents and content (encrypted at rest)
    - **Docker volumes** — persistent storage

    No data is sent to external cloud services unless you connect to other TruSpace nodes.

??? question "Do I need internet access?"
    For initial setup, yes — to pull Docker images and AI models. After that, TruSpace works fully offline unless you want to sync with other nodes.

---

## Installation

??? question "What are the minimum system requirements?"
    | Component | Minimum | Recommended |
    |---|---|---|
    | RAM | 4 GB (no AI) / 8 GB (with AI) | 16 GB |
    | Storage | 10 GB | 100 GB+ |
    | Docker | 20.10+ | Latest |
    | OS | Linux, macOS, Windows (WSL) | Ubuntu 22.04 |

    See [Resource Requirements](../guides/admin/resource-requirements.md) for the full breakdown per deployment profile.

??? question "Why is the first startup so slow?"
    The first startup pulls Docker images (~2–3 GB) and downloads AI models (~1–4 GB depending on the model). Subsequent starts are much faster.

??? question "How do I start without AI features?"
    ```bash
    ./start.sh --no-ai
    ```
    Or set `DISABLE_ALL_AI_FUNCTIONALITY=true` in `.env`.

??? question "Can I use Podman instead of Docker?"
    Yes. Podman is fully compatible. Either add `alias docker=podman` or substitute `podman` for `docker` in all commands. See the [Podman compatibility guide](https://podman-desktop.io/docs/migrating-from-docker/managing-docker-compatibility).

??? question "Can I run TruSpace on a Raspberry Pi?"
    Yes — Raspberry Pi 4/5 with 4 GB+ RAM is supported. Use `tinyllama` as the model or run with `--no-ai` to conserve resources. See the [Raspberry Pi performance tips](installation/remote.md#raspberry-pi-performance-tips).

??? question "How do I access TruSpace from other devices on my network?"
    1. Find your server's IP: `hostname -I`
    2. Update `CORS_ORIGIN` in `.env` with your IP or hostname
    3. Access via `http://<your-ip>:3000`

---

## Documents & Workspaces

??? question "What file types are supported?"
    TruSpace supports most common file types:

    - **Documents**: PDF, DOCX, DOC, TXT, MD, HTML
    - **Spreadsheets**: XLSX, XLS, CSV
    - **Presentations**: PPTX, PPT
    - **Images**: PNG, JPG, GIF, SVG, WebP

    AI analysis works best with text-based formats.

??? question "What's the difference between public and private workspaces?"
    - **Public** — visible to all users on the same TruSpace node
    - **Private** — only invited members can access it

    Neither is visible on the public internet. Even public workspaces are only accessible to users on connected TruSpace nodes.

??? question "How do I share documents with someone on another node?"
    1. Connect your nodes first — see [Connecting Nodes](../guides/admin/connecting-nodes.md)
    2. Invite the user to your workspace by email
    3. Once the invitation event syncs via IPFS, they can access the workspace from their node

??? question "How can I check how many documents are in the system?"
    ```bash
    curl http://<your_truspace_domain>/documents/statistics
    ```

??? question "How do I delete a document or workspace?"
    ```bash
    # Delete a document
    curl -X DELETE http://<your_truspace_domain>/documents/:docId

    # Delete a workspace
    curl -X DELETE http://<your_truspace_domain>/workspaces/:wCID/:wUID
    ```

---

## AI Features

??? question "Which AI models are supported?"
    TruSpace uses Ollama, which supports many models. Common choices:

    | Model | RAM needed | Best for |
    |---|---|---|
    | `tinyllama` | ~2 GB | Raspberry Pi / low-RAM |
    | `phi3` | ~4 GB | Light usage |
    | `llama3.2:3b` | ~4 GB | Default balanced choice |
    | `gemma3:1b` | ~2 GB | Fast and lightweight |

    Set in `.env` with `OLLAMA_MODEL=<model-name>`. Full list at [ollama.com/library](https://ollama.com/library).

??? question "Is AI processing done locally?"
    Yes — all AI processing runs on your server via Ollama. No data is sent to external AI services.

??? question "Why is AI analysis slow?"
    - **No GPU**: inference runs on CPU and can take minutes per document
    - **Large model**: use a smaller model like `tinyllama` or `gemma3:1b` for faster results
    - **Low RAM**: check `free -h`; the model may be swapping

??? question "Why are AI perspectives not being generated?"
    Check the relevant containers:
    ```bash
    docker logs webui
    docker logs ollama
    docker logs truspace-backend
    ```
    Verify the model is downloaded:
    ```bash
    docker exec ollama ollama list
    docker exec ollama ollama pull llama3.2:3b
    ```

---

## Networking & Sync

??? question "How does IPFS sync work?"
    When nodes are connected:

    1. Nodes establish a peer-to-peer swarm connection
    2. IPFS Cluster coordinates which content is pinned where
    3. Content replicates automatically once pinned
    4. Changes sync in near real-time

??? question "Is my data encrypted during sync?"
    Yes — IPFS peer connections are encrypted by default. For additional isolation, TruSpace supports private IPFS networks using shared swarm keys.

??? question "How many nodes can I connect?"
    TruSpace works well with 2–50 nodes. The private IPFS network performs best with fewer than ~20–30 nodes; DHT is disabled in favour of explicit static peering for small networks.

??? question "What if a connected node goes offline?"
    Your local copy remains fully accessible. Changes sync automatically when the offline node reconnects — this is the core benefit of the decentralised design.

??? question "Am I connected to other IPFS peers?"
    ```bash
    docker exec ipfs0 ipfs swarm peers
    docker exec cluster0 ipfs-cluster-ctl peers ls
    ```

---

## Troubleshooting

??? question "Containers won't start — port already in use"
    ```bash
    lsof -i :3000    # Find the process
    kill -9 <PID>    # Stop it
    ```
    Or change the conflicting port in `.env`.

??? question "Out of memory errors"
    - Disable AI: `./start.sh --no-ai`
    - Switch to a smaller model in `.env`
    - Increase swap space (especially on Raspberry Pi)
    - Add resource limits with `docker-compose.override.yml`

??? question "Users can't log in or register"
    Check the backend logs:
    ```bash
    docker logs truspace-backend
    ```
    Ensure the database is accessible:
    ```bash
    docker exec -it truspace-backend-1 sqlite3 /data/truspace.db ".tables"
    ```

??? question "Database migration errors after an update"
    Delete the database to rebuild from scratch:
    ```bash
    rm volumes/db/truspace.db
    ./start.sh
    ```
    !!! warning "Data loss"
        This removes all users, workspaces, and metadata. Back up the file first.

??? question "Permission denied errors"
    ```bash
    sudo usermod -aG docker $USER
    newgrp docker
    sudo chown -R $USER:$USER .
    ```

For more detailed diagnostics, see the [Troubleshooting guide](../reference/troubleshooting.md).

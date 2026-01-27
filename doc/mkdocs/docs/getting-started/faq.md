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
    TruSpace is an AI-infused, decentralized document management system that enables collaboration while maintaining data sovereignty. It uses IPFS for distributed storage and Ollama for local AI processing.

??? question "Is TruSpace free?"
    Yes! TruSpace is 100% open-source under the GPL-3.0 license. You can use, modify, and distribute it freely.

??? question "Where is my data stored?"
    Your data is stored locally on your server/device in:
    
    - **SQLite database**: User credentials and metadata
    - **IPFS**: Documents and content
    - **Docker volumes**: Persistent storage
    
    No data is sent to external cloud services unless you connect to other TruSpace nodes.

??? question "Do I need internet access?"
    For initial setup, yes (to pull Docker images and AI models). After that, TruSpace works fully offline unless you want to sync with other nodes.

## Installation

??? question "What are the minimum system requirements?"
    | Component | Minimum | Recommended |
    |-----------|---------|-------------|
    | RAM | 4 GB | 8 GB+ |
    | Storage | 10 GB | 50 GB+ |
    | Docker | 20.10+ | Latest |
    | OS | Linux, macOS, Windows (WSL) | Ubuntu 22.04 |

??? question "Why is the first startup so slow?"
    The first startup pulls Docker images (~2-3 GB) and downloads AI models (~1-4 GB depending on model). Subsequent starts are much faster.

??? question "How do I start without AI features?"
    ```bash
    ./start.sh --no-ai
    ```

??? question "Can I run TruSpace on a Raspberry Pi?"
    Yes! TruSpace supports Raspberry Pi 4/5 with 4GB+ RAM. See the [Raspberry Pi guide](installation/raspberry-pi.md).

??? question "How do I access TruSpace from other devices on my network?"
    1. Find your server's IP: `hostname -I`
    2. Update `.env` with your IP/hostname
    3. Access via `http://<your-ip>:3000`

## Documents & Workspaces

??? question "What file types are supported?"
    TruSpace supports most common file types:
    
    - **Documents**: PDF, DOCX, DOC, TXT, MD, HTML
    - **Spreadsheets**: XLSX, XLS, CSV
    - **Presentations**: PPTX, PPT
    - **Images**: PNG, JPG, GIF, SVG, WebP
    - **Archives**: ZIP (extracted automatically)
    
    AI analysis works best with text-based formats.

??? question "What's the difference between public and private workspaces?"
    - **Private**: Only invited members can view/access
    - **Public**: Visible to all users on the node
    
    Even public workspaces are only visible to users on connected TruSpace nodes, not the public internet.

??? question "How do I share documents with someone?"
    1. Create or use a workspace
    2. Invite the user to the workspace
    3. Upload the document
    
    For users on different TruSpace nodes, first connect the nodes.

## AI Features

??? question "Which AI models are supported?"
    TruSpace uses Ollama, which supports many models:
    
    - Llama 3.2 (default)
    - Mistral
    - Gemma
    - Phi
    - And [many more](https://ollama.com/library)
    
    Configure in `.env` with `OLLAMA_MODEL=model-name`.

??? question "Is AI processing done locally?"
    Yes! All AI processing happens on your server using Ollama. No data is sent to external AI services.

??? question "Why is AI analysis slow?"
    AI processing depends on your hardware:
    
    - **CPU only**: Can be slow (minutes per document)
    - **With GPU**: Much faster (seconds)
    - **Model size**: Larger models are more accurate but slower
    
    Consider using a smaller model like `tinyllama` for faster results.

??? question "Can I disable AI features?"
    Yes, several ways:
    
    ```bash
    # At startup
    ./start.sh --no-ai
    
    # Or in .env
    DISABLE_ALL_AI_FUNCTIONALITY=true
    ```

## Networking & Sync

??? question "How does IPFS sync work?"
    When you connect TruSpace nodes:
    
    1. Nodes establish a peer connection
    2. IPFS Cluster coordinates pinning
    3. Content replicates automatically
    4. Changes sync in near real-time

??? question "Is my data encrypted during sync?"
    Yes, IPFS connections are encrypted by default. For additional security, TruSpace supports private IPFS networks with shared swarm keys.

??? question "How many nodes can I connect?"
    There's no hard limit. TruSpace works well with 2-50 nodes. For larger deployments, consider IPFS cluster configuration tuning.

??? question "What if a connected node goes offline?"
    Your local copy remains accessible. Changes are synced when the node comes back online. This is the power of decentralization!

## Troubleshooting

??? question "Containers won't start - 'port already in use'"
    Find and stop the conflicting process:
    ```bash
    lsof -i :3000  # Find process
    kill -9 <PID>  # Stop it
    ```
    
    Or change ports in `.env`.

??? question "Out of memory errors"
    - Disable AI: `./start.sh --no-ai`
    - Use a smaller AI model
    - Increase swap space
    - Add resource limits to Docker

??? question "'Permission denied' errors"
    ```bash
    # Fix Docker permissions
    sudo usermod -aG docker $USER
    newgrp docker
    
    # Fix file permissions
    sudo chown -R $USER:$USER .
    ```

??? question "IPFS connection issues"
    ```bash
    # Check IPFS status
    docker exec ipfs0 ipfs swarm peers
    
    # Restart IPFS
    docker compose restart ipfs0 cluster0
    ```

??? question "AI not working"
    1. Check Ollama is running: `docker ps | grep ollama`
    2. Check model is downloaded: `docker exec ollama ollama list`
    3. Check logs: `docker compose logs ollama`

## Security

??? question "Is TruSpace secure for sensitive documents?"
    TruSpace implements several security measures:
    
    - Encrypted credentials (bcrypt)
    - Private IPFS networks
    - Workspace-level encryption
    - No external data transmission
    
    For highly sensitive data, review the [Security documentation](../architecture/security.md).

??? question "How are passwords stored?"
    Passwords are hashed using bcrypt with salt. Plain text passwords are never stored.

??? question "Can I use TruSpace in an air-gapped environment?"
    Yes, after initial setup. Pre-download Docker images and AI models, then TruSpace works fully offline.

## Still Have Questions?

- :fontawesome-brands-github: [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions)
- :material-bug: [Report an Issue](https://github.com/openkfw/TruSpace/issues)
- :material-book: [Full Documentation](../index.md)

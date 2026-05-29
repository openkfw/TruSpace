---
title: Troubleshooting
description: Common issues, debugging tips, and diagnostic commands for TruSpace
icon: material/help-circle
tags:
  - troubleshooting
  - debugging
  - admin
---

# Troubleshooting

This page covers common issues, diagnostic commands, and step-by-step resolution for all TruSpace components.

---

## General Debugging Approach

Before diving into specific issues, run through these checks first:

**1. Are all containers running?**

```bash
docker ps
```

If any container is stopped, start it:

```bash
docker start <container_name>
```

**2. Check container logs:**

```bash
docker logs truspace-backend
docker logs frontend
docker logs ipfs0
docker logs cluster0
docker logs webui
docker logs ollama
```

**3. Check the health endpoint:**

```bash
curl http://<your_truspace_domain>/health
```

This reports the status of the backend, IPFS gateway, pinning service, and cluster.

**4. Inspect configuration files:**

Ensure `.env` values are correct — look for typos in secrets, URLs, and port numbers.

---

## Installation Issues

### Docker: permission denied

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port already in use

```bash
# Find the process occupying the port
lsof -i :3000

# Stop it
kill -9 <PID>
```

Or change the conflicting port in `.env` (e.g. `FRONTEND_PORT`, `BACKEND_PORT`).

### Database migration errors on startup

If you see migration-related errors after pulling a new TruSpace version:

```bash
# Reset the database (all user data will be lost)
rm volumes/db/truspace.db
./start.sh
```

!!! warning "Data loss"
    Deleting `truspace.db` removes all users, workspaces, and metadata. Back up the file first if you need to preserve data.

### `npm` dependency errors after update

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Startup Issues

### Containers won't start

```bash
# View logs for all services at once
docker compose logs -f

# Full reset (removes volumes — use with caution)
docker compose down -v
./start.sh
```

### Slow first startup

The first run pulls Docker images (~2–3 GB) and downloads AI models (~1–4 GB). Subsequent starts are much faster. To skip the AI components entirely:

```bash
./start.sh --no-ai
```

---

## Server & Network Issues

### Server not responding

```bash
curl http://<your_truspace_domain>/health
docker logs truspace-backend
```

Ensure the configured ports are reachable and the firewall is not blocking them.

### Not connected to other IPFS peers

```bash
# Check active swarm connections
docker exec ipfs0 ipfs swarm peers

# Manually connect to a peer
docker exec ipfs0 ipfs swarm connect <multiaddr>

# Check cluster peers
docker exec cluster0 ipfs-cluster-ctl peers ls
```

Also verify:

- The `CLUSTER_SECRET` in `.env` is identical on all nodes
- Port `4001/tcp` (IPFS swarm) and `9096/tcp` (cluster) are open in your firewall
- The IPFS swarm key matches across all nodes (for private networks)

---

## Documents

### How many documents are in the system?

```bash
curl http://<your_truspace_domain>/documents/statistics
```

### Which documents are pinned locally?

```bash
docker exec ipfs0 ipfs pin ls --type=recursive | wc -l
```

Replace `ipfs0` with another node name to query that peer instead.

### Which documents are pinned in the cluster?

```bash
docker exec cluster0 ipfs-cluster-ctl status | grep Pinned
```

### Are there any pinning errors?

```bash
docker exec cluster0 ipfs-cluster-ctl status | grep PIN_ERROR
```

Documents with `PIN_ERROR` status are not properly replicated. Check cluster connectivity.

### Document not rendering

```bash
docker logs frontend
```

Look for fetch or decryption errors in the output.

### AI perspectives not generated automatically

Check all three services that participate in AI generation:

```bash
docker logs webui
docker logs truspace-backend
docker logs ollama
```

Verify the model name in `.env` matches an actually downloaded model:

```bash
docker exec ollama ollama list
```

Pull the model manually if missing:

```bash
docker exec ollama ollama pull llama3.2:3b
```

### How to delete a document

```bash
curl -X DELETE http://<your_truspace_domain>/documents/:docId
```

Replace `:docId` with the actual document ID.

---

## Users

### How many users are registered?

```bash
curl http://<your_truspace_domain>/users/statistics
```

### Which users have access to a workspace?

```bash
curl http://<your_truspace_domain>/permissions/users-in-workspace/:workspaceId
```

To remove a specific permission:

```bash
curl -X DELETE http://<your_truspace_domain>/permissions/users-in-workspace/remove/:permissionId
```

### Which users have contributed to a workspace?

```bash
curl http://<your_truspace_domain>/workspaces/contributors/:wId
```

### Users cannot login or register

```bash
docker logs truspace-backend
```

Confirm the SQLite database is mounted and accessible:

```bash
docker exec -it truspace-backend-1 sqlite3 /data/truspace.db ".tables"
```

---

## Workspaces

### How to delete a workspace

```bash
curl -X DELETE http://<your_truspace_domain>/workspaces/:wCID/:wUID
```

Replace `:wCID` with the workspace CID and `:wUID` with the user ID of the person performing the deletion.

---

## IPFS & Cluster

### Content not syncing between nodes

- Verify `CLUSTER_SECRET` is the same on all peers
- Check cluster membership: `docker exec cluster0 ipfs-cluster-ctl peers ls`
- Restart the cluster service: `docker compose restart cluster0`
- Force a swarm reconnect: `docker exec ipfs0 ipfs swarm connect <peer-multiaddr>`

### Checking pin status across the cluster

```bash
docker exec cluster0 ipfs-cluster-ctl status
```

### Restarting IPFS without losing data

```bash
docker compose restart ipfs0
docker compose restart cluster0
```

---

## AI Issues

### AI not responding or chatbot inaccessible

```bash
curl http://<your_truspace_domain>/health
docker logs webui
docker logs ollama
```

Ensure ports are correctly configured and the Ollama model is downloaded:

```bash
docker exec ollama ollama list
```

### Slow AI processing

- Switch to a lighter model: set `OLLAMA_MODEL=tinyllama` in `.env`
- Enable GPU passthrough in `docker-compose.override.yml`
- Check available RAM: `free -h`

### AI completely disabled but perspectives still attempted

Ensure this is set in `.env`:

```env
DISABLE_ALL_AI_FUNCTIONALITY=true
```

Then restart:

```bash
docker compose down && ./start.sh --no-ai
```

---

## Out of Memory

```bash
# Check current usage
free -h
docker stats

# Restart containers to free memory
docker compose down
docker compose up -d
```

For Raspberry Pi or memory-constrained systems, increase swap:

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile   # set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

## Network Connectivity (Docker)

### Containers on different networks can't communicate

Docker containers on different networks cannot resolve each other by name. Check which network each container is on:

```bash
docker inspect <container_name> | grep NetworkMode
```

Ensure all TruSpace services are on the same Docker network, or add explicit network entries in `docker-compose.yml`.

### Port conflict with host services (e.g. UniFi, other services on 8080)

Remap the conflicting port on the host side in `docker-compose.yml`:

```yaml
ports:
  - "8181:8080"   # host:container — changes only the host-side binding
```

Do not modify the internal container port.

---

## Getting Help

If the steps above don't resolve your issue:

- [:fontawesome-brands-github: Open a GitHub Issue](https://github.com/openkfw/TruSpace/issues)
- [:material-forum: Start a GitHub Discussion](https://github.com/openkfw/TruSpace/discussions)
- Include the output of `docker compose logs` and your `.env` (with secrets redacted)

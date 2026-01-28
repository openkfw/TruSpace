---
title: Troubleshooting
description: Common issues and solutions
icon: material/help-circle
---

# Troubleshooting

Solutions for common TruSpace issues.

## Installation Issues

### Docker Permission Denied

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

## Startup Issues

### Containers Won't Start

```bash
# Check logs
docker compose logs

# Reset and restart
docker compose down -v
./start.sh
```

### Slow Startup

First run downloads images and models. Use `--no-ai` for faster startup.

## IPFS Issues

### No Peers Connected

```bash
# Check peer status
docker exec ipfs0 ipfs swarm peers

# Manual connect
docker exec ipfs0 ipfs swarm connect <multiaddr>
```

### Content Not Syncing

- Verify cluster secret matches
- Check cluster peers: `docker exec cluster0 ipfs-cluster-ctl peers ls`
- Restart cluster: `docker compose restart cluster0`

## AI Issues

### AI Not Responding

```bash
# Check Ollama
docker logs ollama

# Verify model
docker exec ollama ollama list

# Pull model manually
docker exec ollama ollama pull llama3.2:3b
```

### Slow AI Processing

- Use a smaller model
- Enable GPU support
- Check available RAM

## Getting Help

- [GitHub Issues](https://github.com/openkfw/TruSpace/issues)
- [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions)

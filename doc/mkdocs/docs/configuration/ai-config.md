---
title: AI Configuration
description: Configure Ollama and AI features
icon: material/brain
tags:
  - configuration
  - ai
  - ollama
---

# AI Configuration

Configure local AI processing with Ollama.

## Model Selection

### Available Models

| Model | Size | RAM Required | Best For |
|-------|------|--------------|----------|
| `tinyllama` | 637 MB | 2 GB | Quick tests |
| `phi3` | 2.2 GB | 4 GB | Light usage |
| `llama3.2:3b` | 2.0 GB | 4 GB | Balanced |
| `llama3.2:7b` | 4.7 GB | 8 GB | Quality |
| `mistral` | 4.1 GB | 8 GB | General purpose |

### Setting the Model

```env
OLLAMA_MODEL=llama3.2:3b
```

### Download Models Manually

```bash
docker exec ollama ollama pull llama3.2:3b
```

## GPU Acceleration

### NVIDIA GPUs

Ensure NVIDIA Container Toolkit is installed:

```bash
# Install toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### Verify GPU Access

```bash
docker exec ollama nvidia-smi
```

## Disabling AI

For resource-constrained environments:

```bash
# Via flag
./start.sh --no-ai

# Via environment
DISABLE_ALL_AI_FUNCTIONALITY=true
```

## Custom Prompts

AI perspectives use configurable prompts. Customize in the application settings.

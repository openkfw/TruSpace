---
title: Raspberry Pi Setup
description: Deploy TruSpace on Raspberry Pi for edge/low-power scenarios
icon: simple/raspberrypi
tags:
  - installation
  - raspberry-pi
  - arm64
  - edge
---

# Raspberry Pi Setup

Deploy TruSpace on a Raspberry Pi for always-on, low-power edge deployments.

## Supported Hardware

| Model | RAM  | Support                 | Notes                  |
| ----- | ---- | ----------------------- | ---------------------- |
| Pi 5  | 4GB+ | :white_check_mark: Full | Recommended            |
| Pi 4  | 4GB+ | :white_check_mark: Full | Good performance       |
| Pi 4  | 2GB  | :warning: Limited       | No AI features         |
| Pi 3  | Any  | :x: Not supported       | Insufficient resources |

!!! warning "AI Features on Raspberry Pi"
AI features require significant resources. On Pi 4 (4GB), use lightweight models like `tinyllama` or disable AI entirely with `--no-ai`.

## Prerequisites

- Raspberry Pi 4/5 with 4GB+ RAM
- 32GB+ microSD card (64GB recommended)
- Raspberry Pi OS (64-bit) or Ubuntu 22.04 ARM64
- Ethernet or WiFi connection

## Step 1: Prepare the Pi

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
```

## Step 2: Clone and Configure

```bash
# Clone TruSpace
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace

# Execute configuration script
./start.sh
```

The configuration wizard guides you through a number of questions about your desired setup. The basic scenarios are a `development` setup on `localhost` or a `production` setup. If you access your raspberry remotely and it has a (local) domain, choose `production`. If you don't know what to enter for a value or you are in doubt - you can change any values later, so don't stop installing.

## Step 3: Start TruSpace

=== "With AI (4GB+ RAM)"

    ```bash
    # Use a lightweight model
    echo "OLLAMA_MODEL=tinyllama" >> .env
    ./start.sh
    ```

=== "Without AI (Recommended for 4GB)"

    ```bash
    ./start.sh --no-ai
    ```

!!! tip "First Start Takes Time"
The first start will pull Docker images, which can take 10-30 minutes depending on your network speed.

## Step 4: Access TruSpace

From another device on your network:

- **URL**: `http://raspberrypi.local:3000` or `http://<pi-ip>:3000`

## Performance Optimization

### Enable Swap

For better stability with limited RAM:

```bash
# Check current swap
free -h

# Increase swap to 2GB
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Use External SSD

For better IPFS performance, use an external SSD:

```bash
# Mount SSD (example)
sudo mkdir /mnt/ssd
sudo mount /dev/sda1 /mnt/ssd

# Move Docker data directory
sudo systemctl stop docker
sudo mv /var/lib/docker /mnt/ssd/docker
sudo ln -s /mnt/ssd/docker /var/lib/docker
sudo systemctl start docker
```

### Resource Limits

Create `docker-compose.override.yml`:

```yaml
version: "3.8"
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 256M

  ipfs0:
    deploy:
      resources:
        limits:
          memory: 512M
    environment:
      - IPFS_PROFILE=lowpower

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
```

## Auto-Start on Boot

### Using Systemd

Create a systemd service:

```bash
sudo nano /etc/systemd/system/truspace.service
```

```ini title="/etc/systemd/system/truspace.service"
[Unit]
Description=TruSpace
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/TruSpace
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl enable truspace
sudo systemctl start truspace
```

## Monitoring

### Check Resource Usage

```bash
# Overall system
htop

# Docker containers
docker stats
```

### Check Temperatures

```bash
# CPU temperature
vcgencmd measure_temp
```

!!! warning "Thermal Throttling"
If temperatures exceed 80°C, consider adding a heatsink or fan. Throttling will impact performance.

## Troubleshooting

### Out of Memory

```bash
# Check memory usage
free -h

# Restart containers
docker compose down
docker compose up -d
```

### SD Card Issues

```bash
# Check filesystem
sudo fsck /dev/mmcblk0p2

# Check for errors
dmesg | grep -i error
```

### Network Discovery

If `raspberrypi.local` doesn't work:

```bash
# Install mDNS
sudo apt install avahi-daemon -y

# Or use IP directly
hostname -I
```

## Connecting Multiple Pis

Perfect use case for TruSpace! Connect multiple Raspberry Pis:

```bash
# On Pi 1: Generate connection details
./scripts/fetch-connection.sh -e

# Transfer .connection file to Pi 2

# On Pi 2: Connect
./scripts/connectPeer-automatic.sh .connection .connection.password
```

## Next Steps

- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)
- [:octicons-arrow-right-24: Network Configuration](../../configuration/network.md)
- [:octicons-arrow-right-24: Backup & Recovery](../../guides/admin/backup-recovery.md)

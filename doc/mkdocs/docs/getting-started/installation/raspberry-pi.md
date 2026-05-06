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

Deploy TruSpace on a Raspberry Pi for an always-on, low-power node — ideal for home offices, field deployments, or connecting multiple locations.

## Supported Hardware

| Model | RAM  | Support                 | Notes                  |
| ----- | ---- | ----------------------- | ---------------------- |
| Pi 5  | 4GB+ | :white_check_mark: Full | Recommended            |
| Pi 4  | 4GB+ | :white_check_mark: Full | Good performance       |
| Pi 4  | 2GB  | :warning: Limited       | Disable AI features    |
| Pi 3  | Any  | :x: Not supported       | Insufficient resources |

!!! warning "AI Features on Raspberry Pi"
AI features require significant RAM and CPU time. On a Pi 4 (4GB), use a lightweight model like `tinyllama` or `gemma3:1b`, or disable AI entirely with `./start.sh --no-ai`. On a Pi 4 (2GB), always disable AI.

## Prerequisites

- Raspberry Pi 4 or 5 with 4GB+ RAM
- 32GB+ microSD card (64GB recommended for IPFS data)
- Raspberry Pi OS Lite **64-bit** or Ubuntu 22.04 ARM64
- Ethernet or stable WiFi

## Step 1: Prepare the Operating System

### Update packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker

```bash
# Official Docker install script
curl -fsSL https://get.docker.com | sh

# Allow your user to run Docker without sudo
sudo usermod -aG docker $USER

# Apply group change without logging out
newgrp docker

# Verify
docker --version
```

### Enable mDNS (for `.local` hostnames)

If you want to reach the Pi by name (e.g. `smartspace.local`) instead of by IP address, make sure `avahi-daemon` is running:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
```

You can set a memorable hostname for your Pi now — this becomes the address other devices use to reach TruSpace:

```bash
# Example: rename the Pi to "smartspace"
sudo hostnamectl set-hostname smartspace
sudo systemctl restart avahi-daemon
```

After this, your Pi will be reachable at `smartspace.local` from any device on the same network.

## Step 2: Clone TruSpace

```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
```

## Step 3: Configure TruSpace

Run the configuration wizard:

```bash
./start.sh
```

The wizard asks a few questions to generate a `.env` file. For a Raspberry Pi on a local network, **choose profile `2` — local-server**. This profile is designed exactly for this scenario: a server that other devices reach over http on your LAN, without a reverse proxy or SSL certificate.

```
  1) local-dev    — On THIS machine only (localhost, for development)
  2) local-server — LAN/home server with a hostname or IP, accessed over http directly
  3) production   — Internet-facing server with https via a reverse proxy
  4) custom       — Configure all settings manually

Select profile [1]: 2
```

### Key questions you'll be asked

**Domain / hostname**
Enter the hostname you set in Step 1 — for example `smartspace.local`. If you skipped the hostname step, enter the Pi's IP address instead (find it with `hostname -I`):

```
DOMAIN - Hostname or domain where TruSpace is reachable [example.com]: smartspace.local
```

**Master password**
Choose a secure password (minimum 8 characters). The default `Kennwort123` is rejected in `local-server` mode to protect your data.

**AI model**
Pick a lightweight model suitable for the Pi. Press ENTER to keep the default `gemma3:1b`, or type `tinyllama` for a smaller option:

```
OLLAMA_MODEL - Ollama model for document analysis [gemma3:1b]: tinyllama
```

**Open WebUI admin email and password**
These are for the AI admin interface. Use a real email format and a secure password.

Everything else can be confirmed with ENTER — the wizard pre-fills sensible defaults for a LAN server.

!!! tip "Changed your mind? No problem."
You can re-run the wizard at any time with `./start.sh --configure-env`, or edit `.env` directly.

## Step 4: Start TruSpace

```bash
./start.sh
```

The first start downloads Docker images and (if AI is enabled) the Ollama model. On a home broadband connection this typically takes **10–30 minutes**. You can follow the progress with:

```bash
docker compose logs -f
```

To start without AI features (recommended on Pi 4 with 4GB if you notice memory pressure):

```bash
./start.sh --no-ai
```

### Verify everything is running

```bash
docker ps
```

You should see containers named `ipfs0`, `cluster0`, `truspace-backend-1`, `truspace-frontend-1`, and (if AI is enabled) `truspace-webui-1`.

## Step 5: Access TruSpace

From any device on the same network, open a browser and go to:

```
http://smartspace.local:3000
```

(Replace `smartspace.local` with whatever hostname or IP you entered during setup.)

Register your first user account and log in. The AI status indicator in the top right corner of the UI turns green once the model has finished loading — this can take a few minutes after the first start.

## Performance Tuning

### IPFS low-power profile

If IPFS is consuming too many resources, apply the built-in low-power profile:

```bash
docker exec ipfs0 ipfs config profile apply lowpower
docker compose restart ipfs0
```

### Increase swap space

Swap gives the Pi a safety buffer when RAM runs short:

```bash
# Check current swap
free -h

# Increase swap to 2GB
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile   # set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Use an external SSD

An SSD dramatically improves IPFS write performance and extends the life of your microSD card:

```bash
# Mount the SSD (adjust device path as needed)
sudo mkdir /mnt/ssd
sudo mount /dev/sda1 /mnt/ssd

# Move Docker's data directory to the SSD
sudo systemctl stop docker
sudo mv /var/lib/docker /mnt/ssd/docker
sudo ln -s /mnt/ssd/docker /var/lib/docker
sudo systemctl start docker
```

To make the mount permanent across reboots, add an entry to `/etc/fstab`. Find the UUID with `blkid /dev/sda1`.

### Set container memory limits

Create a `docker-compose.override.yml` in the TruSpace directory to cap memory usage per container:

```yaml
version: "3.8"
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          memory: 256M

  ipfs0:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Auto-Start on Boot

Create a systemd service so TruSpace restarts automatically after a reboot or power cut:

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

```bash
sudo systemctl daemon-reload
sudo systemctl enable truspace
sudo systemctl start truspace
```

## Monitoring

```bash
# Container resource usage (CPU, RAM, network)
docker stats

# System overview
htop

# CPU temperature (throttles above ~80°C)
vcgencmd measure_temp
```

!!! warning "Thermal Throttling"
If the temperature exceeds 80°C the Pi will reduce its clock speed, noticeably slowing TruSpace. Add a heatsink or active cooling if this happens regularly.

## Troubleshooting

### Pi not reachable at `hostname.local`

The `.local` address requires mDNS. On the Pi:

```bash
# Check avahi is running
sudo systemctl status avahi-daemon

# Start it if stopped
sudo systemctl enable --now avahi-daemon
```

On Windows, you may need to install [Bonjour Print Services](https://support.apple.com/kb/DL999) to resolve `.local` names. As a fallback, always use the IP address directly (`hostname -I` on the Pi).

### Out of memory

```bash
free -h                        # check current usage
docker compose down            # stop all containers
docker compose up -d           # restart them fresh
```

Also consider increasing swap (see above) or starting without AI: `./start.sh --no-ai`.

### SD card read errors

```bash
# Check filesystem integrity (run with containers stopped)
sudo fsck /dev/mmcblk0p2

# Look for hardware errors in the kernel log
dmesg | grep -i error
```

Persistent errors usually mean the card is failing — back up your data and replace it. Running IPFS and Docker on an external SSD (see above) avoids this problem entirely.

### Containers keep restarting

```bash
# See what went wrong
docker compose logs --tail=50 <container-name>
```

Common causes: insufficient RAM (enable swap or use `--no-ai`), a corrupted database (`volumes/db/truspace.db`), or a port conflict on the host.

## Connecting Multiple Raspberry Pis

TruSpace was built with exactly this use case in mind. Each Pi runs a full node; documents pinned on one are automatically replicated to the others.

```bash
# On Pi 1: export connection details
./scripts/fetch-connection.sh -e

# Copy the generated .connection file to Pi 2 (e.g. via scp)
scp truspace.connection pi@smartspace2.local:~/TruSpace/

# On Pi 2: connect to Pi 1
./scripts/connectPeer-automatic.sh truspace.connection
```

## Next Steps

- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)
- [:octicons-arrow-right-24: Network Configuration](../../configuration/network.md)
- [:octicons-arrow-right-24: Backup & Recovery](../../guides/admin/backup-recovery.md)

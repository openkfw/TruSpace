---
title: Remote Server Setup
description: Deploy TruSpace on a server or Raspberry Pi, accessible from other devices
icon: material/server
tags:
  - installation
  - server
  - raspberry-pi
  - production
---

# Remote Server Setup

Deploy TruSpace on a server or Raspberry Pi and access it from other devices. This guide covers two sub-scenarios — choose the tab that matches your situation:

|                  | **LAN / HTTP**                               | **Internet / HTTPS** |
| ---------------- | -------------------------------------------- | -------------------- |
| Typical hardware | Raspberry Pi, home server                    | VPS, cloud server    |
| Access           | Local network only                           | Publicly reachable   |
| Domain           | Hostname (e.g. `smartspace.local`) or LAN IP | Real domain with DNS |
| SSL              | Not required                                 | Required (Certbot)   |
| Reverse proxy    | Not required                                 | nginx                |

## Prerequisites

=== "LAN / HTTP"

    - Raspberry Pi 4/5 (4 GB+ RAM) or any Linux server on your network
    - 32 GB+ storage (64 GB+ recommended for IPFS data)
    - Docker 20.10+ and Docker Compose 2.0+
    - Git

=== "Internet / HTTPS"

    - Linux server with a public IP (Ubuntu 22.04 LTS recommended)
    - Domain name with a DNS A-record pointing to your server
    - 8 GB RAM minimum (16 GB recommended with AI features)
    - Docker 20.10+, Docker Compose 2.0+, Git

## Step 1: Install Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Clone TruSpace

```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
```

## Step 3: Configure TruSpace

```bash
./start.sh
```

The wizard asks a few questions to generate `.env`. For any remote deployment — LAN or internet — **choose profile `2) production`**:

```
  1) local-dev    — On THIS machine only (localhost, for development)
  2) production   — Any server deployment: LAN/home server or internet-facing
                    (e.g. Raspberry Pi at smartspace.local, or truspace.example.com)
                    You choose http or https, with or without a reverse proxy.
  3) custom       — Configure everything manually (advanced)

Select profile [1]: 2
```

The profile pre-configures sensible server defaults (`BUILD_OR_PULL_IMAGES=pull`, `START_PRIVATE_NETWORK=true`, `RATE_LIMIT_PER_MINUTE=60`, auto-generated secrets) and then prompts you for the settings that vary between deployments:

**Protocol — http or https?**

```
PROTOCOL - Use HTTPS? [Y/n]:
```

=== "LAN / HTTP → answer `n`"

    The wizard will set `PROTOCOL=http`. Because secure cookies require HTTPS, the application automatically adjusts `NODE_ENV` to `development` and you will see this notice:

    ```
    ⚠  HTTP selected on the production profile.
       NODE_ENV  → development  (secure cookies require HTTPS)
       LOG_LEVEL → DEBUG
       RATE_LIMIT → 200/min  (relaxed for LAN use)
       Only use this on a trusted private network.
    ```

    This is expected and correct for a LAN deployment. Do not expose the server to the internet over HTTP.

=== "Internet / HTTPS → answer `y` (default)"

    The wizard keeps `NODE_ENV=production` and all security hardening active.

**Domain / hostname**

=== "LAN / HTTP"

    Enter the server's hostname (e.g. `smartspace.local`) or its LAN IP address. To use a `.local` name on a Raspberry Pi, set it up first:

    ```bash
    sudo hostnamectl set-hostname smartspace
    sudo apt install -y avahi-daemon
    sudo systemctl enable --now avahi-daemon
    ```

    Then enter `smartspace.local` when prompted.

=== "Internet / HTTPS"

    Enter your public domain name (e.g. `truspace.example.com`).

**Reverse proxy — yes or no?**

```
USE_REVERSE_PROXY - Are you using a reverse proxy (nginx, Caddy, Traefik)
                   that terminates SSL and routes traffic? [y/N]:
```

=== "LAN / HTTP → answer `n` (default)"

    TruSpace is accessed directly on its ports (`http://<hostname>:3000`). No proxy is needed.

=== "Internet / HTTPS → answer `y`"

    Enables proxy-mode URLs (no port numbers in external URLs). Your proxy must route `/api` → backend:8000 and `/` → frontend:3000. See Step 4 below.

**Remaining prompts** (both scenarios)

- **Master password** — minimum 8 characters; the default `Kennwort123` is rejected.
- **SMTP settings** — for registration confirmation and password-reset emails. Press ENTER to skip if you don't have an SMTP server yet.
- **Open WebUI admin email and password** — for the AI management interface.
- **`REGISTER_USERS_AS_INACTIVE`** — when enabled, new accounts need admin approval before they can log in (requires working SMTP or manual database access).

JWT and session secrets are auto-generated. Everything else can be confirmed with ENTER.

!!! tip "Re-run the wizard at any time"
`bash
    ./start.sh --configure-env
    `

## Step 4: Configure nginx and SSL (Internet / HTTPS only)

Skip this step for LAN / HTTP deployments.

### Install nginx and Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Configure the firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (required for Certbot)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 4001/tcp  # IPFS swarm
sudo ufw enable
```

### Create the nginx site

```bash
sudo nano /etc/nginx/sites-available/truspace
```

Start with HTTP only (Certbot will upgrade it to HTTPS):

```nginx title="/etc/nginx/sites-available/truspace"
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host             $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host             $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
        client_max_body_size 100M;
    }

    location /health {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/truspace /etc/nginx/sites-enabled/
# Remove the default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Obtain SSL certificate

```bash
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run   # verify auto-renewal
```

After Certbot runs, add security headers and WebSocket support to the HTTPS block:

```bash
sudo nano /etc/nginx/sites-available/truspace
```

```nginx title="/etc/nginx/sites-available/truspace"
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options           "SAMEORIGIN"                          always;
    add_header X-Content-Type-Options    "nosniff"                             always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin"     always;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade            $http_upgrade;
        proxy_set_header   Connection         'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Forwarded-Host  $host;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass       http://localhost:8000;
        proxy_set_header Host             $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
        client_max_body_size 100M;
    }

    location /health {
        proxy_pass       http://localhost:8000;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Step 5: Start TruSpace

=== "LAN / HTTP"

    ```bash
    ./start.sh
    ```

    TruSpace will be available at `http://<hostname-or-ip>:3000` from any device on your network.

    On a Raspberry Pi 4 (4 GB), if memory is tight:
    ```bash
    ./start.sh --no-ai
    ```

=== "Internet / HTTPS"

    ```bash
    ./start.sh --remove-peers
    ```

    `--remove-peers` prevents the IPFS node from connecting to unknown public bootstrap nodes.

    Verify the deployment:
    ```bash
    curl -I https://yourdomain.com           # Frontend → 200
    curl https://yourdomain.com/health       # Health → JSON
    ```

## Step 6: Auto-Start on Boot

Create a systemd service so TruSpace restarts automatically after a reboot:

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
WorkingDirectory=/home/pi/TruSpace   # adjust path as needed
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=pi                               # adjust user as needed

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable truspace
```

## Raspberry Pi: Performance Tips

??? tip "IPFS low-power profile"

    ```bash
    docker exec ipfs0 ipfs config profile apply lowpower
    docker compose restart ipfs0
    ```

??? tip "Increase swap space"

    ```bash
    sudo dphys-swapfile swapoff
    sudo nano /etc/dphys-swapfile   # set CONF_SWAPSIZE=2048
    sudo dphys-swapfile setup
    sudo dphys-swapfile swapon
    ```

??? tip "Use an external SSD (recommended)"

    Running IPFS and Docker on an SSD dramatically improves performance and extends the life of your microSD card.

    ```bash
    sudo systemctl stop docker
    sudo mv /var/lib/docker /mnt/ssd/docker
    sudo ln -s /mnt/ssd/docker /var/lib/docker
    sudo systemctl start docker
    ```

??? tip "Set container memory limits"

    Create `docker-compose.override.yml` in the TruSpace directory:

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

## Data & Backups

All persistent data lives in `./volumes/`. Back it up regularly along with `.env`:

```bash
# Backup
docker compose down
tar czf truspace-backup-$(date +%Y%m%d).tar.gz ./volumes .env
docker compose up -d

# Restore
docker compose down
rm -rf ./volumes
tar xzf truspace-backup-<date>.tar.gz
sudo chown -R 1000:1000 ./volumes
docker compose up -d
```

For production, schedule a daily backup:

```bash
echo "0 2 * * * cd /opt/TruSpace && docker compose down && tar czf /backups/truspace-\$(date +\%Y\%m\%d).tar.gz ./volumes .env && docker compose up -d" | crontab -
```

## Updating TruSpace

```bash
git pull origin main
docker compose down
docker compose pull
./start.sh        # add --remove-peers for internet deployments
```

!!! warning "Check release notes before updating"
Some updates include database schema changes that require deleting `./volumes/db/truspace.db` before restarting. Documents stored in IPFS are not affected.

## Troubleshooting

**Pi not reachable at `hostname.local`**

```bash
sudo systemctl enable --now avahi-daemon
# On Windows, install Bonjour Print Services for .local resolution
```

**502 Bad Gateway (internet/HTTPS only)**

```bash
docker ps                       # check containers are running
docker compose logs backend     # look for startup errors
```

**Out of memory (Raspberry Pi)**

```bash
free -h
./start.sh --no-ai   # disable AI to free RAM
```

**Volume permission errors**

```bash
sudo chown -R 1000:1000 ./volumes
```

**Database error after an update**

```bash
# ⚠️ Deletes all accounts and workspace metadata; IPFS documents are unaffected
rm ./volumes/db/truspace.db
docker compose restart backend
```

## Next Steps

- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)
- [:octicons-arrow-right-24: Network Configuration](../../configuration/network.md)
- [:octicons-arrow-right-24: Backup & Recovery](../../guides/admin/backup-recovery.md)

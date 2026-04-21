# Installation

---

Steps 1 to 3 cover the basic installation and startup process for any environment.

Sections A to C provide environment-specific instructions for local development, standalone servers, and Raspberry Pi.

Sections D and E include verification steps and helpful notes for all environments.

---

## Prerequisites

- **Docker** (all environments)
- **Git** (all environments)
- **Node.js** (only if you run the frontend locally via `--local-frontend` or for dev workflows)
- **Windows users**: Use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)

---

# 1) Clone the repository

```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
```

---

# 2) Configure the environment

TruSpace uses a generated `.env` file. The configuration script supports **profiles** to prefill defaults.

```bash
bash scripts/configure-env.sh
```

> Note: `start.sh` will generate `.env` automatically if it doesn’t exist, or you can force regeneration with `./start.sh --configure-env`.

### Profiles in `configure-env.sh`
- **development**: optimized for local testing, verbose logs, minimal external dependencies
- **production**: secure defaults, expects domain + SMTP
- **custom**: prompts for everything

> Tip: If you run `./start.sh --dev`, the script automatically uses the **development** profile.

### Key values to understand
- `DOMAIN`, `API_DOMAIN`, `FRONTEND_PORT`, `API_PORT`
- `DISABLE_ALL_AI_FUNCTIONALITY` (set to `true` to disable AI)
- `OLLAMA_MODEL` (e.g. `gemma3:1b`)
- `ADMIN_USER_EMAIL`, `ADMIN_USER_PASSWORD` (OpenWebUI)
- `SMTP_*` values if you enable user activation via email

### Align API settings with your deployment
`configure-env.sh` computes `NEXT_PUBLIC_API_URL` from `API_DOMAIN` + `API_PORT`. Make sure these match your **public** API URL:

- **Single domain + `/api` path** (common for reverse proxy):
  - Set `API_DOMAIN` to your main domain (e.g. `example.com`)
  - Set `API_PORT` to your public port (usually `443`)
  - Configure nginx to proxy `/api` → `http://localhost:8000`

- **API subdomain** (e.g. `api.example.com`):
  - Set `API_DOMAIN=api.example.com`
  - Set `API_PORT=443`
  - Configure nginx for that subdomain

If you only want to test locally, keep defaults and use `localhost` URLs.

---

# 3) Start TruSpace

```bash
bash start.sh
```

### Flags aligned to `start.sh`
- `--dev` → development mode (builds images locally, uses dev settings)
- `--local-frontend` → run frontend outside Docker (for debugging)
- `--no-ai` → disables AI (same as `DISABLE_ALL_AI_FUNCTIONALITY=true`)
- `--remove-peers` → remove IPFS bootstrap peers after startup
- `--configure-env` → generate `.env`

---

# A) Local Development / Testing

## A1) Start dev environment
```bash
bash start.sh --dev
```

- TruSpace UI: <http://localhost:3000/>
- Open WebUI: <http://localhost:3333/>

### Optional: disable AI
Either:
- Set `DISABLE_ALL_AI_FUNCTIONALITY=true` in `.env`, or
- Run `bash start.sh --dev --no-ai`

### Optional: run frontend locally
```bash
bash start.sh --dev --local-frontend
```
> Requires Node.js installed.

### Optional: Mail testing with Mailhog
```bash
docker run -p 8025:8025 -p 1025:1025 --name="mailhog" -e MH_HOSTNAME='mailhog.local' mailhog/mailhog
```
Mail UI: <http://localhost:8025/>

---

## A2) Windows (WSL) adjustments

If you hit port conflicts with Windows services:

1. Change the **external backend port** (default `8000`) to something else (e.g. `8001`) in:
   - `./frontend/Dockerfile`
   - `./frontend/startup.sh`
   - `./frontend/src/config.ts`
   - `.env` (`API_PORT`)

2. If you run a **standalone Ollama container** with host port `11434`, change it to another free port in `docker-compose-ai.yml`.
   - In the current setup, Ollama is bundled inside the WebUI image and does **not** expose `11434` to the host, so this step is only needed if you customize the AI setup.

Then run:
```bash
bash start.sh --dev
```

After the first run:
```bash
chmod -R 777 volumes
```

Open WebUI setup:
- Visit <http://localhost:3333>, login with `.env` credentials
- Go to **Admin Settings → Settings → Connections**
- Set Ollama endpoint to:
  - `http://localhost:11434` (bundled Ollama), or
  - `http://ollama:11434` if you run Ollama as a separate container
- Verify connection, then download the model specified in `.env`

---

# B) Standalone Server / VM (Linux)

This path assumes **Ubuntu** (or similar). Skip any step already done.

## B1) DNS and firewall

### DNS
Create A-records pointing to the server IP:
- `EXAMPLE.COM`
- `oi.EXAMPLE.COM` (Open WebUI)
- Optional: `api.EXAMPLE.COM` if you want a separate API subdomain

Get public IP:
```bash
curl ifconfig.me
```

### Firewall ports
Open:
- 22 (SSH)
- 80 (HTTP for certbot)
- 443 (HTTPS)
- 4001 (IPFS swarm)
- 9096 / 9097 (IPFS cluster)

Example (ufw):
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4001/tcp
sudo ufw allow 9096/tcp
sudo ufw allow 9097/tcp
```

---

## B2) Install system packages
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install git -y
```

---

## B3) Reverse proxy + SSL (nginx + certbot)

Install:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx certbot python3-certbot-nginx -y
```

Enable nginx:
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Create nginx config
Replace `EXAMPLE.COM` in all examples with your actual domain (e.g. `truspace.dev`).
```bash
sudo nano /etc/nginx/sites-available/EXAMPLE.COM
```

Place this content inside, adjusting domains and proxy targets as needed:
```nginx
server {
    listen 80;
    server_name EXAMPLE.COM;
    client_max_body_size 100M;

    location /api {
        proxy_pass http://localhost:8000;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    listen 80;
    server_name oi.EXAMPLE.COM;
    location / {
        proxy_pass http://localhost:3333;
    }
}
```

Enable and test & reload:
```bash
sudo ln -s /etc/nginx/sites-available/EXAMPLE.COM /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL certificates (LetsEncrypt)
```bash
sudo certbot --nginx -d EXAMPLE.COM -d oi.EXAMPLE.COM
```

After certbot, **manually add `proxy_set_header`** to preserve host headers (required for CORS / Next.js server actions).

Example HTTPS config (important headers included):

```nginx
server {
    server_name EXAMPLE.COM;

    listen 443 ssl; # managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/EXAMPLE.COM/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/EXAMPLE.COM/privkey.pem;   # managed by Certbot
    include             /etc/letsencrypt/options-ssl-nginx.conf;          # managed by Certbot
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;               # managed by Certbot

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://localhost:3000;

        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    }
}

server {
    server_name oi.EXAMPLE.COM;

    listen 443 ssl; # managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/EXAMPLE.COM/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/EXAMPLE.COM/privkey.pem;   # managed by Certbot
    include             /etc/letsencrypt/options-ssl-nginx.conf;          # managed by Certbot
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;               # managed by Certbot

    location / {
        proxy_pass http://localhost:3333;

        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    }
}
```

---

## B4) Install Docker
Follow: https://docs.docker.com/engine/install/ubuntu/

Validate:
```bash
sudo docker run hello-world
```

Make sure to enable the entire docker functionality in the post-install steps:
https://docs.docker.com/engine/install/linux-postinstall/

Reboot and verify:
```bash
docker run hello-world
```

---

## B5) Configure and start TruSpace
```bash
bash scripts/configure-env.sh
bash start.sh --remove-peers
```

> `--remove-peers` avoids connecting to known bootstrap peers. You can add peers later.

---

## B6) Configure AI (Open WebUI)
If needed:

1. Open `https://oi.EXAMPLE.COM`
2. Login using `.env` values: `ADMIN_USER_EMAIL`, `ADMIN_USER_PASSWORD`
3. Go to **Administration → Connections**
4. Set Ollama endpoint to:
   - `http://localhost:11434` (bundled Ollama)
5. Download model (e.g. `gemma3:1b`)

---

# C) Raspberry Pi

## C1) Install base system
- Install Raspberry Pi OS
- Enable SSH
- Install Docker: https://docs.docker.com/engine/install/raspberry-pi-os/
  Or:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Install Git

---

## C2) Clone and start
```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
```

### Option A: run configuration script (recommended)
```bash
bash scripts/configure-env.sh
bash ./start.sh
```

### Option B: quick local domain replace
```bash
sed 's|http://localhost|http://raspidomain.local|g' .env.example > .env
bash ./start.sh
```

### Performance tips (Pi)
- Apply IPFS low-power config:
  ```bash
  docker exec ipfs0 ipfs config profile apply lowpower
  ```
- Increase swap if memory is low
- Run TruSpace with disabled AI (`--no-ai` or `DISABLE_ALL_AI_FUNCTIONALITY=true`) if you don’t need it, as AI models can be resource-intensive

---

## C3) AI model settings
- `OLLAMA_MODEL` in `.env` (default: `gemma3:1b`)
- Models available: https://ollama.com/library

### Alternative Open WebUI setup
- Open: `<hostname>:3333`
- Set Ollama endpoint to:
  - `http://localhost:11434` (bundled Ollama)
- Pull the model
- Ensure `.env` `OLLAMA_MODEL` matches the model name

---

# D) Verify installation (all environments)

1. Open the UI:
   - Local: <http://localhost:3000/>
   - Server: `https://yourdomain.com/`
2. Register a user
3. Upload a document
4. Verify AI processing (if enabled)

If something fails:
- Check browser console
- Check containers:
  ```bash
  docker compose logs -f
  ```

---

# E) Helpful notes

- **Skip domains/SSL** if you just want local testing.
- **OpenWebUI** may take a few minutes to become healthy after startup.
- **AI is optional**; use `--no-ai` or `DISABLE_ALL_AI_FUNCTIONALITY=true`.
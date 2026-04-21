# Installation

---

Prerequisites are required for all environments. Make sure to complete those before proceeding.

Steps 1 to 3 cover the basic installation and startup process for any environment.

Sections A to C provide environment-specific instructions for local development, standalone servers, and Raspberry Pi.

Sections D to F include verification steps, helpful notes for all environments and troubleshooting tips when starting to run TruSpace.

---

## Prerequisites

### P1: Docker

Docker is used to run TruSpace in a containerized environment, ensuring that all dependencies are managed and the application runs consistently across different systems.

To get started with Docker, you need to install it on your machine. You can follow the official installation guide for your operating system:

- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker Engine on Linux](https://docs.docker.com/engine/install/)

> [!NOTE]
> If you are not allowed to use Docker e.g. in your enterprise environment (have to have licenses, etc.), you can install [Podman](https://podman.io/docs/installation) on all systems instead. The docker commands can be used interchangeably with podman commands. For more information on using Podman, please refer to the [Podman documentation](https://podman.io/docs/). Usually, all commands should work interchangeably, without any issues (see [Managing Docker compatibility](https://podman-desktop.io/docs/migrating-from-docker/managing-docker-compatibility)). However, should there be issues regarding the docker commands, you can either change docker in the CLI to a podman alias i.e. `alias docker=podman` or change the word `docker` in all commands to `podman`.

Once Docker/Podman is installed, you can verify the installation by running the following command:

```bash
docker --version # if not working, try: podman --version
```

This should display the installed version of Docker/Podman.

### P2: Git

Make sure that Git is installed (often comes preinstalled). You can check if Git is installed by running the following command in your terminal:

```bash
git --version
```

If Git is not installed, you can install it using the package manager for your operating system.

```bash
# For Ubuntu/Debian
sudo apt-get install git

# For MacOS
brew install git
```

If you have not connected to a GitHub account yet, please register. We recommend to create a SSH key via the following commands and add it to your GitHub account:

```bash
# Generate a new SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Start the SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key to the SSH agent
ssh-add ~/.ssh/id_rsa

# Copy the SSH key to your clipboard
cat ~/.ssh/id_rsa.pub
```

### P3: Windows users only: WSL

We recommend using [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install)

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

You can find a detailed description of all environment variables in [ENVIRONMENT_VARIABLES.md](./../../ENVIRONMENT_VARIABLES.md)

### Align API settings with your deployment

`configure-env.sh` computes `NEXT_PUBLIC_API_URL` from `API_DOMAIN` + `API_PORT`. Make sure these match your **public** API URL:

**Single domain + `/api` path** (common for reverse proxy):
  - Set `API_DOMAIN` to your main domain (e.g. `example.com`)
  - Set `API_PORT` to your public port (usually `443`)
  - Configure nginx to proxy `/api` → `http://localhost:8000`

If you only want to test locally, keep defaults and use `localhost` URLs.

---

# 3) Start TruSpace

```bash
bash start.sh
```

### Optional `--dev`: development mode

This builds the backend and frontend images locally instead of pulling from the registry, and applies development settings (e.g. verbose logging, CORS for localhost). Use this when actively developing or debugging.

### Optional `--local-frontend`: run frontend locally

This allows you to debug the frontend with hot reload and local dev tools. The other containers still run in Docker.

> Requires Node.js installed.

### Optional `--no-ai`: disable AI

This can be useful for low-resource environments (e.g. Raspberry Pi) or if you simply don’t need AI features.
Either:

- Set `DISABLE_ALL_AI_FUNCTIONALITY=true` in `.env`, or
- Run `bash start.sh --no-ai`

### Optional `--remove-peers`: remove IPFS bootstrap peers

This prevents your IPFS node from connecting to the default bootstrap peers, which can be useful for testing in isolated environments or if you want to connect only to specific peers.

### Optional `--configure-env`: generate `.env`

This forces regeneration of the `.env` file using the configuration script. Useful if you want to change your environment settings after the initial setup.

---

# A) Local Development / Testing

## Install general and additional prerequisites

### ADDITIONAL: Node.js

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. npm is the package manager for Node.js, allowing you to install and manage packages for your project.

To install Node.js and npm, you can use the package manager for your operating system:

```bash
# For Ubuntu/Debian
sudo apt-get install nodejs npm

# For MacOS
brew install node
```

Hint: to install it on WSL, follow [this guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl).

Once Node.js and npm are installed, you can verify the installation by running the following commands:

```bash
node --version
npm --version
```

This should display the installed versions of Node.js and npm.

### ADDITIONAL: TypeScript

To install TypeScript, you can use npm:

```bash
npm install -g typescript
```

Once TypeScript is installed, you can verify the installation by running the following command:

```bash
tsc --version
```

### OPTIONAL: IDE

We recommend using Visual Studio Code or Zed as your Integrated Development Environment (IDE) for TruSpace development (or Vim for advanced users ;)). It provides excellent support for TypeScript, Docker, and Git. We have also included a `.vscode` and `.zed` folder in the repository with recommended settings and extensions for your convenience.

### OPTIONAL: Chrome Developer Tools

If you are testing and debugging in Google Chrome, we recommend the following extensions:

- [React Developer Tools](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?pli=1)
- [Redux Developer Tools](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

## A1) Start dev environment

Install all prerequisites, then run:

```bash
bash start.sh --dev
```

However when developing the frontend, **we recommend to start the frontend locally, not in a container**:

```bash
./start.sh --dev --local-frontend
```

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

## B4) Install Docker and other prerequisites

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
bash start.sh
```

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

## C1) Install base system and prerequisites

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


---

# F) Troubleshooting when starting to run TruSpace

The following are some troubleshooting hacks we have used in the past for different problems (e.g. when pulling a new TruSpace version):

- Delete existing file `volumes/db/truspace.db` (if it exists) to **reset the database** (e.g. migration scripts that once existed and thus also in the db no longer exist, thus the database should be reset and built from scratch)
- Make sure that **`npm` is up to date** for the backend and frontend with `cd backend/frontend npm install`

If you come across any other troubleshooting hacks, feel free to add them to this list!
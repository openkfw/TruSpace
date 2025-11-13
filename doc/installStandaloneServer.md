# Install TruSpace on a bare server or virtual machine running Linux

Starting from an empty Ubuntu VM, follow these detailed steps. In case a chapter is already done or clear to you, skip it

## Setup basic infrastructure

- Setup the DNS records to reflect the domain (e.g. `EXAMPLE.COM`) together with API endpoint (e.g. `api.EXAMPLE.COM` and Open Web UI endpoint (e.g. `oi.EXAMPLE.COM`) to the respective IP address of the server. Your IP address can be found using:

```bash
   curl ifconfig.me
```

- Open the firewall ports:

  - 22 inbound for SSH connection, if needed
  - 80 inbound for http communication for certbot to issue an https certificate
  - 443 inbound for https communication
  - 4001 inbound/outbound for the IPFS swarm connection
  - 9096/9097 inbound/outbound for the IPFS cluster connection

If your server uses the integrated firewall, enable respective ports

```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 4001/tcp
  sudo ufw allow 9096/tcp
  sudo ufw allow 9097/tcp
```

- Update the system

```bash
  sudo apt update
  sudo apt upgrade
```

- Install git to clone the repository with

```bash
sudo apt install git -y
```

## Setup forward proxy nginx with SSL and LetsEncrypt

- Ensure your domain (e.g., `EXAMPLE.COM`, `truspace.dev`) has an A record pointing to your server's public IP address.
- Install `nginx` and `certbot` for SSL certs

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx certbot python3-certbot-nginx -y
```

- Enable `nginx` and start the service

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

- Create a config file for your domain. In all commands, please replace `EXAMPLE.COM` with your domain (e.g. `truspace.dev`):

```bash
sudo nano /etc/nginx/sites-available/EXAMPLE.COM
```

- Paste this basic configuration and replace EXAMPLE.COM with your domain name. This configuration is without SSL, we'll do this later:

```nginx
server {
    listen 80;
    server_name EXAMPLE.COM;
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

server {
    listen 80;
    server_name api.EXAMPLE.COM;
    client_max_body_size 100M;
    location / {
        proxy_pass http://localhost:8000;
    }
}
```

- Test the nginx configuration file using

```bash
sudo nginx -t
```

- Enable the config with the respective domain name instead of `EXAMPLE.COM`:

```bash
sudo ln -s /etc/nginx/sites-available/EXAMPLE.COM /etc/nginx/sites-enabled/
```

- Test and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Expected result:

```bash
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

- To get certificates from LetsEncrypt, use certbot. Certbot will automatically edit your `nginx` config to include HTTPS.

```bash
sudo certbot --nginx -d EXAMPLE.COM -d oi.EXAMPLE.COM -d api.EXAMPLE.COM
```

Expected result:

```bash
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for EXAMPLE.COM and 2 more domains

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/EXAMPLE.COM/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/EXAMPLE.COM/privkey.pem
This certificate expires on 2025-08-31.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for EXAMPLE.COM to /etc/nginx/sites-enabled/EXAMPLE.COM
Successfully deployed certificate for oi.EXAMPLE.COM to /etc/nginx/sites-enabled/EXAMPLE.COM
Successfully deployed certificate for api.EXAMPLE.COM to /etc/nginx/sites-enabled/EXAMPLE.COM
Congratulations! You have successfully enabled HTTPS on https://EXAMPLE.COM, https://oi.EXAMPLE.COM, and https://api.EXAMPLE.COM

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

- The resulting config in `nano  /etc/nginx/sites-available/EXAMPLE.COM` should be something like the config below.
  **Make sure that the headers are rewritten using `proxy_set_header` in order for CORS to work correctly; this needs to be done manually and is important!**

```nginx
# ──────────────────────────────────────────────────────────────────────────────
# HTTPS Servers
# ──────────────────────────────────────────────────────────────────────────────

server {
    server_name EXAMPLE.COM;

    listen 443 ssl; # managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/EXAMPLE.COM/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/EXAMPLE.COM/privkey.pem;   # managed by Certbot
    include             /etc/letsencrypt/options-ssl-nginx.conf;          # managed by Certbot
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;               # managed by Certbot

    location / {
        proxy_pass http://localhost:3000;

        # preserve original host for Next.js server actions
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        # (optional but recommended)
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

server {
    server_name api.EXAMPLE.COM;
    client_max_body_size 100M;

    listen 443 ssl; # managed by Certbot
    ssl_certificate     /etc/letsencrypt/live/EXAMPLE.COM/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/EXAMPLE.COM/privkey.pem;   # managed by Certbot
    include             /etc/letsencrypt/options-ssl-nginx.conf;          # managed by Certbot
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;               # managed by Certbot

    location / {
        proxy_pass http://localhost:8000;

        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# HTTP → HTTPS Redirects (managed by Certbot)
# ──────────────────────────────────────────────────────────────────────────────

server {
    listen 80;
    server_name EXAMPLE.COM;
    if ($host = EXAMPLE.COM) {
        return 301 https://$host$request_uri;
    }
    return 404;
}

server {
    listen 80;
    server_name oi.EXAMPLE.COM;
    if ($host = oi.EXAMPLE.COM) {
        return 301 https://$host$request_uri;
    }
    return 404;
}

server {
    listen 80;
    server_name api.EXAMPLE.COM;
    if ($host = api.EXAMPLE.COM) {
        return 301 https://$host$request_uri;
    }
    return 404;
}
```

## Install docker

- Install docker according to [this guide](https://docs.docker.com/engine/install/ubuntu/)

To make sure that your installation worked, run `sudo docker run hello-world`. Expected output:

```bash
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
e6590344b1a5: Pull complete
Digest: sha256:0b6a027b5cf322f09f6706c754e086a232ec1ddba835c8a15c6cb74ef0d43c29
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

- Make sure to enable the entire docker functionality in the [post install guide](https://docs.docker.com/engine/install/linux-postinstall/)

To make sure that your installation worked for all non-root users and docker is restarted when the server starts, reboot the server and try:

```bash
docker run hello-world
```

Expected output:

```bash
Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

- Login again to the system in order to execute docker with the correct user

## Clone and configure the TruSpace repository

- Clone the repository with anonymous access. If you have the git ssh keys configured you can also use the ssh link.

```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
```

## 📥 Start of the server

For an initial configuration of the application run the configuration script. It asks you a couple of configuration questions, if in doubt accept the default settings. You can easily change them later.

```bash
bash scripts/configure-env.sh
```

Then start the TruSpace installation with option `--remove-peers`, so that your server doesn't connect to any known boostrap peers in the network. You can add other peers later if you like:

```bash
bash start.sh --remove-peers
```

If you check the installation with `docker ps` you should see these containers running:

| IMAGE                                | COMMAND                | STATUS                        | PORTS                                                                                                                      | NAMES              |
| ------------------------------------ | ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| ipfs/ipfs-cluster:latest             | "/sbin/tini -- /usr/…" | Up 14 minutes                 | 0.0.0.0:9094->9094/tcp, [::]:9094->9094/tcp, 0.0.0.0:9096-9097->9096-9097/tcp, [::]:9096-9097->9096-9097/tcp, 9095/tcp     | cluster0           |
| ghcr.io/open-webui/open-webui:ollama | "bash start.sh"        | Up 14 minutes (healthy)       | 0.0.0.0:3333->8080/tcp, [::]:3333->8080/tcp                                                                                | truspace-webui-1   |
| truspace-backend                     | "sh ./entrypoint.sh"   | Restarting (1) 24 seconds ago |                                                                                                                            | truspace-backend-1 |
| ipfs/kubo:release                    | "/sbin/tini -- /usr/…" | Up 14 minutes (healthy)       | 0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp, 0.0.0.0:5001->5001/tcp, [::]:5001->5001/tcp, 4001/udp, 0.0.0.0:8080->8080/tcp |

You can also make sure that everything is correctly running when the status in the top right corner are all green (can take a few minutes for th OI bubble).

Alternatively, you can set flags in `start.sh` to enable certain behaviors:

- `--dev` : starts the application in development mode (always build backend and frontend instead of pulling docker images (identical to `BUILD_OR_PULL_IMAGES=build`))
- `--local-frontend`: start the frontend locally instead of in Docker
- `--no-ai`: disable AI functionality (Ollama and Open-WebUI) when starting the application (identical to `DISABLE_ALL_AI_FUNCTIONALITY=true`)
- `--remove-peers`: after IPFS starts, remove default bootstrap peers via the IPFS API

## Configure AI backend with OI and test

TruSpace downloads the configured AI model automatically if it is not present. If you need to check the respective AI installation do the following steps (optional)

- Login to the subdomain of the [Open Web UI](https://oi.truspace.dev) using the credentials in the `.env` file: `ADMIN_USER_EMAIL` and `ADMIN_USER_PASSWORD`
- Go to `Administration` and `Connection` and update the connection endpoint of ollama to `http://localhost:11434`. No API key is needed.
- Download a model by selecting a model and typing the model name (e.g. `gemma3:1b`). Open Web UI should provide an option to download from [ollama.com](ollama.com). Because websockets are disabled in the configuration, the download takes a while until the frontend responds, so be patient.

## Test the TruSpace installation

- Access TruSpace via `https://example.com/register` and register a user
- If the registration does not work, checkout the browser console and the running containers using `docker compose logs -f`
- Upload a document and verify that everything works

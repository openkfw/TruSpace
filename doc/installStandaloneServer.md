# Install brainstorming summary

Starting from an empty Ubuntu VM, follow these steps. In case a chapter is already done or clear to you, skip it

## Setup basic infrastructure

- Update the system

```bash
  sudo apt update
  sudo apt upgrade
```

- Install git to clone the repository with

```bash
sudo apt install git -y
```

- Open the firewall ports:
  - 443 for https communication
- Setup the DNS records to reflect the domain (e.g. `example.com`) together with API endpoint (e.g. `api.example.com` and Open Web UI endpoint (e.g. `oi.example.com`)

## Setup forward proxy nginx with SSL and LetsEncrypt

- Ensure your domain (e.g., `truspace.dev`) has an A record pointing to your server's public IP address.
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

- Create a config file for your domain. In all commands, please replace `example.com` with your domain:

```bash
sudo nano /etc/nginx/sites-available/example.com
```

- Paste this basic configuration (without SSL yet):

```nginx
server {
    listen 80;
    server_name truspace.dev;
    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    listen 80;
    server_name oi.truspace.dev;
    location / {
        proxy_pass http://localhost:3333;
    }
}

server {
    listen 80;
    server_name api.truspace.dev;
    location / {
        proxy_pass http://localhost:8000;
    }
}
```

- Enable the config:

```bash
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
```

- Test and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

- To get certificates from LetsEncrypt, use certbot. Certbot will automatically edit your `nginx` config to include HTTPS.

```bash
sudo certbot --nginx -d truspace.dev -d oi.truspace.dev -d api.truspace.dev
```

- The resulting config in `/etc/nginx/sites-available/example.com` should be something like:

```nginx
# Redirect HTTP to HTTPS globally
server {
    server_name truspace.dev;
    location / {
        proxy_pass http://localhost:3000;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/truspace.dev/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/truspace.dev/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

server {
    server_name oi.truspace.dev;
    location / {
        proxy_pass http://localhost:3333;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/truspace.dev/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/truspace.dev/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

server {
    server_name api.truspace.dev;
    location / {
        proxy_pass http://localhost:8000;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/truspace.dev/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/truspace.dev/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

server {
    if ($host = truspace.dev) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name truspace.dev;
    return 404; # managed by Certbot


}

server {
    if ($host = oi.truspace.dev) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name oi.truspace.dev;
    return 404; # managed by Certbot


}

server {
    if ($host = api.truspace.dev) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name api.truspace.dev;
    return 404; # managed by Certbot


}
```

## Install docker

- Install docker according to [install and post install](https://docs.docker.com/engine/install/linux-postinstall/)
- Login again to the system in order to execute docker with the correct user

## Clone and configure the TruSpace repository

- Clone the repository with

```bash
git clone git@github.com:openkfw/TruSpace.git
cd truspace
```

- Copy `.env.example` to `.env`

```bash
cp .env.example .env
cp ./frontend/.env.example ./frontend/.env
```

- **Update** the environment variables, because some of these are used when the containers are startup the first time and volumes created!

## Start and test TruSpace backend

- Start all containers using the `start.sh` script

```bash
./start.sh
```

The result should look something like this

| IMAGE                                | COMMAND                | STATUS                        | PORTS                                                                                                                      | NAMES              |
| ------------------------------------ | ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| ipfs/ipfs-cluster:latest             | "/sbin/tini -- /usr/…" | Up 14 minutes                 | 0.0.0.0:9094->9094/tcp, [::]:9094->9094/tcp, 0.0.0.0:9096-9097->9096-9097/tcp, [::]:9096-9097->9096-9097/tcp, 9095/tcp     | cluster0           |
| ghcr.io/open-webui/open-webui:ollama | "bash start.sh"        | Up 14 minutes (healthy)       | 0.0.0.0:3333->8080/tcp, [::]:3333->8080/tcp                                                                                | truspace-webui-1   |
| truspace-backend                     | "sh ./entrypoint.sh"   | Restarting (1) 24 seconds ago |                                                                                                                            | truspace-backend-1 |
| ipfs/kubo:release                    | "/sbin/tini -- /usr/…" | Up 14 minutes (healthy)       | 0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp, 0.0.0.0:5001->5001/tcp, [::]:5001->5001/tcp, 4001/udp, 0.0.0.0:8080->8080/tcp |

## Configure AI backend with OI and test

- After initial start, all volumes are created with root and not the docker user. Therefore from the `truspace` folder, you have to change the volumes permissions

```bash
sudo chown -R <user>:<group> volumes/
```

- Login to the subdomain of the [Open Web UI](https://oi.truspace.dev) using the credentials in the `.env` file: `ADMIN_USER_EMAIL` and `ADMIN_USER_PASSWORD`
- Go to `Administration` and `Connection` and update the connection endpoint of ollama to `http://localhost:11434`. No API key is needed.
- Download a model by selecting a model and typing the model name (e.g. `gemma3:1b`). Open Web UI should provide an option to download from [ollama.com](ollama.com). Because websockets are disabled in the configuration, the download takes a while until the frontend responds, so be patient.
- Test with a simple chat, should result in something like this (TODO, insert image)

## Configure TruSpace

- Access TruSpace and register a user
- Upload a document and verify that everything works

## Configure access to IPFS

- In volumes, add the IP address and cluster ID in the multicast format to service.json peers

## Developer only: Starting frontend from Node

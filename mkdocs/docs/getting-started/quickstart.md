---
title: Quick Start
description: Get TruSpace running in under 5 minutes
icon: material/timer-sand
tags:
  - installation
  - quickstart
  - docker
---

# Quick Start

Get TruSpace up and running in under 5 minutes with this guide.

## :material-numeric-1-circle: Clone the Repository

=== "SSH (Recommended)"

    ```bash
    git clone git@github.com:openkfw/TruSpace.git
    cd TruSpace
    ```

=== "HTTPS"

    ```bash
    git clone https://github.com/openkfw/TruSpace.git
    cd TruSpace
    ```

## :material-numeric-2-circle: Start TruSpace

```bash
./start.sh
```

!!! info "What happens under the hood?"
    The `start.sh` script:
    
    1. Creates a `.env` file from `.env.example`
    2. Creates necessary Docker volumes
    3. Pulls/builds Docker images
    4. Starts all containers via Docker Compose
    5. Downloads the default AI model (if AI enabled)

### Optional Flags

Customize your startup with these flags:

| Flag | Description |
|------|-------------|
| `--dev` | Development mode - builds images locally |
| `--no-ai` | Disable AI features (Ollama/Open Web UI) |
| `--local-frontend` | Run frontend outside Docker |
| `--remove-peers` | Remove default IPFS bootstrap peers |

```bash
# Example: Start without AI for faster startup
./start.sh --no-ai

# Example: Development mode
./start.sh --dev
```

## :material-numeric-3-circle: Verify Installation

Check that all containers are running:

```bash
docker ps
```

You should see these containers:

```
CONTAINER ID   IMAGE                              STATUS          PORTS
14f...         ghcr.io/open-webui/open-webui     Up (healthy)    0.0.0.0:3333->8080/tcp
412...         ipfs/ipfs-cluster:latest          Up              0.0.0.0:9094->9094/tcp
7b4...         truspace-backend                  Up              0.0.0.0:8000->8000/tcp
783...         truspace-frontend                 Up (healthy)    0.0.0.0:3000->3000/tcp
590...         ipfs/kubo:release                 Up (healthy)    0.0.0.0:4001->4001/tcp
```

!!! warning "Missing Containers?"
    If some containers aren't running, check the logs:
    ```bash
    docker compose logs -f
    ```

## :material-numeric-4-circle: Open the Application

Open your browser and navigate to:

:point_right: **[http://localhost:3000](http://localhost:3000)**

You should see the login screen:

![TruSpace Login Screen](../assets/images/login.png){ loading=lazy }

## :material-numeric-5-circle: Create Your First User

1. Click **"Register"** on the login page
2. Fill in your details:
   - Username
   - Email
   - Password
3. Click **"Submit"**

!!! tip "Local Account"
    Your user account is stored locally in SQLite. Your data never leaves your server.

After registration, you'll be redirected to the login page. Enter your credentials to access the dashboard.

## :material-numeric-6-circle: Create a Workspace

Once logged in:

1. Click **"Create Workspace"** on the dashboard
2. Enter a workspace name
3. Choose visibility (public or private)
4. Start uploading documents!

---

## :white_check_mark: Success!

Congratulations! You now have TruSpace running locally. Here's what you can do next:

<div class="grid cards" markdown>

-   :material-file-upload: **Upload Documents**

    Add your first documents to a workspace.

    [:octicons-arrow-right-24: Documents Guide](../guides/user/documents.md)

-   :material-brain: **Try AI Analysis**

    Let AI interpret your documents.

    [:octicons-arrow-right-24: AI Features](../guides/user/ai-features.md)

-   :material-connection: **Connect Nodes**

    Sync with other TruSpace installations.

    [:octicons-arrow-right-24: Connect Nodes](../guides/admin/connecting-nodes.md)

-   :material-cog: **Customize Settings**

    Configure environment variables.

    [:octicons-arrow-right-24: Configuration](../configuration/index.md)

</div>

---

## Troubleshooting

### Port Already in Use

If you get a port conflict error:

```bash
# Check what's using the port
lsof -i :3000

# Or use a different port in .env
FRONTEND_PORT=3001
```

### Docker Permission Denied

On Linux, you may need to run Docker without sudo:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Slow Startup

First startup can be slow due to:

1. Pulling Docker images (~2-3 GB)
2. Downloading AI models (~1-4 GB)

Use `--no-ai` for faster startup if you don't need AI features.

### More Help

- Check the [FAQ](faq.md) for common questions
- Visit [Troubleshooting](../reference/troubleshooting.md) for detailed solutions
- Ask in [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions)

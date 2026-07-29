---
title: Local Setup
description: Run TruSpace on your local machine via localhost
icon: material/laptop
tags:
  - installation
  - local
---

# Local Setup

Run TruSpace on your own machine and access it at `http://localhost:3000`.

## Installation

```bash
git clone https://github.com/openkfw/TruSpace.git
cd TruSpace
./start.sh
```

On the **first run**, `./start.sh` detects that no `.env` file exists and launches the configuration wizard. Select profile **`1) local-dev`** and confirm the defaults with ENTER. TruSpace will then start automatically.

Once running, open [http://localhost:3000](http://localhost:3000) in your browser.

!!! tip "Re-run the wizard at any time"
`bash
    ./start.sh --configure-env
    `

## Options

| Flag               | Effect                                                       |
| ------------------ | ------------------------------------------------------------ |
| `--no-ai`          | Disable Ollama / Open WebUI to save RAM                      |
| `--dev`            | Build images locally instead of pulling                      |
| `--local-frontend` | Run the Next.js frontend outside Docker (enables hot reload) |

### Development with hot reload

If you are actively working on the frontend or backend, you can run those outside Docker while keeping the infrastructure (IPFS, database) containerised:

=== "Frontend hot reload"

    ```bash
    # Terminal 1 — infrastructure + backend in Docker
    ./start.sh --local-frontend

    # Terminal 2 — frontend with hot reload
    cd frontend
    npm install
    npm run dev
    ```

=== "Frontend + backend hot reload"

    ```bash
    # Terminal 1 — IPFS and AI only
    docker compose up ipfs0 cluster0 ollama webui -d

    # Terminal 2 — backend
    cd backend && npm install && npm run dev

    # Terminal 3 — frontend
    cd frontend && npm install && npm run dev
    ```

## Managing Containers

```bash
# View running containers
docker ps

# Follow logs
docker compose logs -f

# Stop (keeps data)
docker compose down

# Stop and delete all data ⚠️
docker compose down -v
```

## Data & Backups

All persistent data is stored in `./volumes/` inside the project folder.

```bash
# Back up
docker compose down
tar czf truspace-backup-$(date +%Y%m%d).tar.gz ./volumes .env
docker compose up -d

# Restore
docker compose down
rm -rf ./volumes
tar xzf truspace-backup-<date>.tar.gz
docker compose up -d
```

## Troubleshooting

**Port already in use**

```bash
lsof -i :3000   # find what's using the port
kill -9 <PID>
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

- [:octicons-arrow-right-24: Environment Variables](../../configuration/environment-variables.md)
- [:octicons-arrow-right-24: Connecting Nodes](../../guides/admin/connecting-nodes.md)

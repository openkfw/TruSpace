# Install image and docker

- Use raspberry installation guide to install plain raspbian
- Configure ssh
- Install docker
- Install git

# Clone repo

- Clone TruSpace into a folder

```bash
git clone https://github.com/openkfw/TruSpace.git
```

- Execute configuration script `bash ./scripts/configure-env.sh`. Select `development` as `NODE_ENV`, in case the raspberry runs on a local installation and is not available via DNS. Otherwise the CORS handling might be too strict.

- If the IPFS connection is too slow, you can also execute `docker exec ipfs0 ipfs config profile apply lowpower`, which creates a config file that is optimised for slow servers. However you have to update the `Routing` variable to `dht` again in the config file in `./volumes/ipfs0/config`:

```
"Routing": {
    "Type": "dht"
  },
```

# OPTIONAL: Configure Large Language Model (LLM)

- LLM is configured in `.env` file
- Default is `gemma3:1b`
- Available models are at https://ollama.com/library

# Build IPFS cluster image

- The `latest` tag of ipfs-cluster does not support arm64v8, therefore clone the ipfs-cluster image and execute `docker build . -t truspace/ipfs-cluster`.

```bash
cd ~
git clone https://github.com/ipfs-cluster/ipfs-cluster.git
cd ipfs-cluster
docker build . -t truspace/ipfs-cluster
```

- Replace the image tag `ipfs/ipfs-cluster:latest` in `docker-compose.yml` with the built image `truspace/ipfs-cluster`

# Initial start of TruSpace via docker compose

- Execute `start.sh` and check that all containers are up and running

```bash
bash start.sh
```

or

```sh
./start.sh
```

Alternatively, you can set flags in `start.sh` to enable certain behaviors:

- `--dev` : starts the application in development mode (always build backend and frontend instead of pulling docker images (identical to `BUILD_OR_PULL_IMAGES=build`))
- `--local-frontend`: start the frontend locally instead of in Docker
- `--no-ai`: disable AI functionality (Ollama and Open-WebUI) when starting the application (identical to `DISABLE_ALL_AI_FUNCTIONALITY=true`)
- `--remove-peers`: after IPFS starts, remove default bootstrap peers via the IPFS API

---

**NOTE**

If you plan to use a custom local domain (e.g. `truspace.local` instead of `localhost`), you have to set the respective environment variable and update CORS settings in the `.env`file, therefore in the `.env` file update the lines
`NEXT_PUBLIC_API_URL=http://truspace.local:8000/api`
`CORS_ORIGIN=http://truspace.local:3000`

---

# Register and login to TruSpace

- Execute `<hostname>:3000` and register a user
- Login with this user
- Create workspaces etc
- Upload a document and check that the AI is working and generating perspectives

# Connect IPFS node

Please refer to [this guide](./Admin%20Guide/Setup%20TruSpace/Connecting%20to%20other%20nodes.md) to connect your Raspberry Pi IPFS node to other nodes in the network.

---

# Alternative configuration of OI and model

- Login to the OI at `<hostname>:3333`
- Configure a new connection for ollama using `http://ollama:11434` instead of `docker.internal`
- Pull an AI model from the search bar, e.g. `gemma3:1b`, the model should be pulled from ollama
- Make sure that `OLLAMA_MODEL` in `.env` is the same value, so that Truspace actually uses the desired model
- Test the AI with a simple conversion in Open Web UI

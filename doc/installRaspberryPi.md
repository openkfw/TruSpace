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

- Copy `.env.example` into `.env`

```bash
cd TruSpace
cp .env.example .env
```

- Update `.env` with respective host names

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

- To connect another node, it needs to be added to the cluster
- Enter `~/truspace/volumes/cluster0/service.json` and enter the peer node in field `peer_addresses`
- Restart cluster container
- Login to cluster0 with `docker exec -it cluster0 sh` and execute `ipfs-cluster-ctl peers ls`. The top line should say `cluster0 | Sees *1* other peers`

---

# Alternative configuration of OI and model

- Login to the OI at `<hostname>:3333`
- Configure a new connection for ollama using `http://ollama:11434` instead of `docker.internal`
- Pull an AI model from the search bar, e.g. `gemma3:1b`, the model should be pulled from ollama
- Make sure that `OLLAMA_MODEL` in `.env` is the same value, so that Truspace actually uses the desired model
- Test the AI with a simple conversion in Open Web UI


# Install image and docker
- Use raspberry installation guide to install plain raspbian
- Configure ssh
- Install docker
- Install git

# Clone repo

- Clone TruSpace into a folder
- Copy `.env.example` into `.env`
- Update `.env` with respective host names
- In `frontend` folder copy `env.example` into `env` and update host name

# Build IPFS cluster image

- The `latest` tag of ipfs-cluster does not support arm64v8, therefore clone the ipfs-cluster image and execute `docker build . -t smartspace/ipfs-cluster`. 
- Replace the image tag in `docker-compose.yml` with the built image `smartspace/ipfs-cluster`

# Initial start of TruSpace via docker compose
- Execute `start.sh` and check that all containers are up and running

# Configure OI and download model
- Login to the OI at `<hostname>:3333` 
- Configure a new connection for ollama using `http://ollama:11434` instead of `docker.internal`
- Pull an AI model from the search bar, e.g. `gemma3:1b`, the model should be pulled from ollama
- Test the AI with a simple conversion in Open Web UI

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

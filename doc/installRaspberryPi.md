# Install image and docker

- Use raspberry installation guide to install plain raspbian
- Configure ssh
- Install docker (e.g. using the official [install guide](https://docs.docker.com/engine/install/raspberry-pi-os/)) or via the official install script `curl -fsSL https://get.docker.com | sh`
- Install git

# Clone repo

- Clone TruSpace into a folder

```bash
git clone https://github.com/openkfw/TruSpace.git
```

- Update your domain with

```bash
sed 's|http://localhost|http://raspidomain.local|g' .env.example > .env
```

- Initially build and start docker containers with

```bash
bash ./start.sh
```

- If the raspberry is too slow, apply a low power IPFS configuration `docker exec ipfs0 ipfs config profile apply lowpower`
- Also increase the `swap` file size if the raspberry runs out of memory

# OPTIONAL: Configure Large Language Model (LLM)

- LLM is configured in `.env` file
- Default is `gemma3:1b`
- Available models are at https://ollama.com/library

---

# Register and login to TruSpace

- Execute `<hostname>:3000` and register a user
- Login with this user
- Create workspaces etc
- Upload a document and check that the AI is working and generating perspectives

---

# Alternative configuration of OI and model

- Login to the OI at `<hostname>:3333`
- Configure a new connection for ollama using `http://ollama:11434` instead of `docker.internal`
- Pull an AI model from the search bar, e.g. `gemma3:1b`, the model should be pulled from ollama
- Make sure that `OLLAMA_MODEL` in `.env` is the same value, so that Truspace actually uses the desired model
- Test the AI with a simple conversion in Open Web UI

# 🌐 TruSpace - an ai-infused, decentralized and sovereign document workspace

The purpose of TruSpace is to make collaboration on documents between several stakeholders more efficient while making the respective data sovereign to all participants. It uses AI to support document interpretation and decentralization to stay in control of your data.

**Collaborative, decentralized document sharing and editing platform** built with **Next.js**, **Express.js**, **SQLite**, and **IPFS Cluster**. Enhanced with local LLM capabilities via **Ollama**, **Open Web UI** and a nice web-interface.

✨ Key Features

- 🆓 100% open-source, sovereign and self-hostable - no cloud provider needed
- 🔄 Automatic sync of data between trusted IPFS cluster nodes/partners (private or public setup)
- 🧠 Local AI interpretation of documents using Ollama + Open Web UI using customisable pre-defined prompts
- 🗂️ Workspace-based organization of content and participants
- 📄 Rich-text collaborative editing (WYSIWYG)
- 🌍 Fully decentralized storage using IPFS Cluster
- 🔐 Local storage of sensitive data in SQLite

---

# I need to...

- 🧪 [Play around in a sandbox demo environment](#play-around-in-a-sandbox-demo-environment)
- 💻 [Run it locally on my machine](#run-it-locally-on-my-machine)
- 🛠️ [Install a standalone server](#install-a-standalone-server)
- 🌐 [Connect to other TruSpace nodes](#connect-to-other-truspace-nodes)
- 📚 [Check out architecture, guides, details](#check-out-architecture-guides-details)

## Play around in a sandbox demo environment

To check how TruSpace works, get to the sandbox installation at https://truspace.dev, register a new user, login and start playing with private and public workspaces!

## Run it locally on my machine

For a very **quick and easy** TruSpace setup (e.g. for demos and first look), run:

```bash
git clone git@github.com:openkfw/TruSpace.git
# Start development server
sh start.sh
```

This command spins up `docker compose` containing backend api and IPFS clusters and additionally NextJS frontend in dev mode. After startup, the frontend is available on `http://localhost:3000`. Register a user, login and create a workspace for documents!

To enable AI analysis, you need to download the LLM model of your choice, as an example here is `gemma3:1b` and you can see the full list at the [ollama DB](https://ollama.com/library?q=mistral&sort=popular).

- Login to the Open Web UI on `http://localhost:3333`. For login, use the values from the `.env` file (`ADMIN_USER_EMAIL`), by default `admin@admin.com/admin`. Type the model you specified in the `.env` in the `OLLAMA_MODEL` variable in the search bar and Open Web UI offers you to download it.

  ![Screenshot of downloading AI model](./doc/screenshotDownloadAIModel.png)

- Once the model is downloaded, AI analysis is executed upon each document upload automatically.

**You made it and should see this**

![Screenshot of dashboard](./doc/screenshot_dashboard.png)

If something doesn't work, check that all containers are running with `docker ps`. They should show these containers:
| CONTAINER ID | IMAGE | COMMAND | CREATED | STATUS | PORTS | NAMES |
|--------------|--------------------------------------|--------------------------|------------------|--------------------------|--------------------------------------------------------------------------------------------------|---------------------|
| 14f... | ghcr.io/open-webui/open-webui:main | "bash start.sh" | 26 minutes ago | Up 26 minutes (healthy) | 0.0.0.0:3333->8080/tcp | truspace-webui-1 |
| 412... | ipfs/ipfs-cluster:latest | "/usr/bin/tini -- /u…" | 26 minutes ago | Up 26 minutes | 0.0.0.0:9094->9094/tcp, 0.0.0.0:9096-9097->9096-9097/tcp, 9095/tcp | cluster0 |
| 7b4...| truspace-backend | "sh ./entrypoint.sh" | 26 minutes ago | Up 26 minutes | 0.0.0.0:8000->8000/tcp | truspace-backend-1 |
| 783... |truspace-frontend | "sh startup.sh" | 26 minutes ago | Up 26 minutes (healthy) | 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp | truspace-frontend-1|
| 590... | ipfs/kubo:release | "/sbin/tini -- /usr/…" | 26 minutes ago | Up 26 minutes (healthy) | 0.0.0.0:4001->4001/tcp, 0.0.0.0:5001->5001/tcp, 4001/udp, 0.0.0.0:8080->8080/tcp, 8081/tcp | ipfs0 |

## Install a standalone server

There's an extensive guide how to install TruSpace on a (virtual) server or a Raspberry Pi. It includes steps how to install surrounding architecture like docker, a reverse proxy `nginx`, certificates via `LetsEncrypt` and all the other administrative steps. Have a look [here](./doc/installStandaloneServer.md)

## Connect to other TruSpace nodes

You have a TruSpace node running and would like to connect to another (private) network to sync the TruSpace data? Here's what to do:

- TODO swarm key?
- other secrets?
- service.json cluster

## Check out architecture, guides, details..

### Run development environment for coding

For an installation guide in a development setup, please see [Installation and running of local environment](./doc/DEV_INSTALLATION.md)

### ⚙️ Environment Variables

This project uses a set of environment variables to configure its frontend, backend, IPFS, and AI components.

For a complete reference and description of all variables, see  
➡️ [ENVIRONMENT_VARIABLES.md](./doc/ENVIRONMENT_VARIABLES.md)

### 🧑‍💻 User Guide

An extensive user guide with screenshots is available in the folder [User Guide](./doc/User%20Guide/)

### Tech Architecture overview

In the overview, you can see how the components work together. The UI and API is part of this repository and provides the interface and the translation to other services. Once you start TruSpace, it pulls and connects to containers from Open Web UI (for AI processing) and IPFS/IPFS-Cluster to persist the data. The respective ports are outlined in the image.

![Architecture](./doc/tech-arch-diagram.PNG "Tech Architecture overview")

### 🧰 Tech Stack

| Layer          | Technology                                                          |
| -------------- | ------------------------------------------------------------------- |
| Frontend       | [Next.js](), [Radix UI](https://www.radix-ui.com/)                  |
| Backend        | [Express.js](https://expressjs.com/)                                |
| Database       | [SQLite](https://sqlite.org/)                                       |
| Decentralized  | [IPFS](https://ipfs.tech/), [IPFS Cluster](https://ipfscluster.io/) |
| LLM Engine     | [Ollama](https://ollama.com/)                                       |
| AI API and RAG | [Open Web UI](https://openwebui.com/)                               |

### Data model for workspaces in IPFS

The data model has a hierarchical structure of workspaces, documents and metadata. They are linked using UUIDs in the metadata-fields of the IPFS files. Each data entry is a single (small) file to avoid merge conflicts in the IPFS network, e.g. in case of network split. The concept is outlined in the visual representation of the [Data model](./doc/datamodel.png "Data model")

The specific fields are described in [backend/src/types/interfaces/truspace.ts](backend/src/types/interfaces/truspace.ts)

### 🔄 IPFS Sync for the decentralization of data

- Each organization runs its own node
- Nodes automatically replicate documents and metadata (e.g. chats, versions, AI perspectives) within the network
- Fault-tolerant and censorship-resistant

TODO

### 🔐 Security & Data Privacy

- Sensitive data (e.g. login credentials) is stored encrypted in **SQLite** on the local node
- Documents are synced only to **trusted IPFS peers**, IPFS can be configured as private network by default
- All inter-node communications are encrypted
- Documents are encrypted with workspace ID

## 🤝 Contribution Guide

We welcome contributions! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Setting up a development environment
- Reporting issues and submitting pull requests
- Code style guidelines

---

## 🛣 Roadmap

- [ ] Real-time collaboration with CRDTs
- [ ] Role-based access controls
- [ ] Federated identity system
- [ ] Mobile-friendly UI
- [ ] Plugin system for document types and AI models

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](./LICENSE) file for details.

---

## 💬 Community & Support

- Discussions: [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions)
- Report issues: [GitHub Issues](https://github.com/openkfw/TruSpace/issues)

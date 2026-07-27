<div align="center">
    <img src="./frontend/public/images/TruSpaceLogo.svg" height="180">

  <h1>TruSpace</h1>

  <p><strong>A decentralized, sovereign document workspace for organizations that don't want to hand their data to a cloud provider.</strong></p>

  <p>
    <a href="https://ipfs.tech"><img src="https://img.shields.io/badge/IPFS-000000?style=for-the-badge&logo=ipfs&logoColor=white" alt="IPFS"></a>
    <a href="https://ipfscluster.io"><img src="https://img.shields.io/badge/IPFS%20Cluster-262626?style=for-the-badge" alt="IPFS Cluster"></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://reactjs.org"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/GPL--3.0-red?style=for-the-badge" alt="GPL v3"></a>
  </p>

  <p>
    <a href="https://web.truspace.dev/site/"><strong>📚 Documentation</strong></a> ·
    <a href="https://truspace.dev"><strong>🧪 Try the Sandbox</strong></a> ·
    <a href="#-quick-start">🚀 Quick Start</a> ·
    <a href="https://www.youtube.com/watch?v=Tkhag_dVfhc">▶️ Watch the Trailer</a> ·
    <a href="https://github.com/openkfw/TruSpace/discussions">💬 Discussions</a>
  </p>
</div>

---

Document collaboration between multiple organizations usually means one of them has to trust a third party — a cloud provider, a platform vendor, a "neutral" middleman — with everyone's data. **TruSpace removes that requirement.**

It's a network where every participant (or organization) runs their **own node**. Documents, versions, and metadata are synced peer-to-peer over **IPFS**, so no single party owns or controls the data. Everyone keeps a full, verifiable copy. On top of that, TruSpace adds local AI to help teams actually understand what's in the documents they share — without ever sending that content to an external API.

## ✨ Why TruSpace

- 🔓 **Sovereign by design** — 100% open-source and self-hostable. No cloud account, no vendor lock-in, no third party holding your data.
- 🌐 **Truly decentralized** — built on IPFS/IPFS Cluster. Every organization runs its own node; data replicates automatically across trusted peers and survives network splits.
- 🛡️ **Fault-tolerant & censorship-resistant** — there is no central server to take down or subpoena. Peers can run as a private network.
- 🧠 **AI-assisted, not AI-dependent** — local LLMs (Ollama + Open Web UI) help interpret documents with customizable prompts, entirely on infrastructure you control.
- 🗂️ **Built for real collaboration** — workspaces organize content and participants across institutional boundaries.

If you're an institution that needs to collaborate on sensitive documents with partners, regulators, or subsidiaries you don't fully control — and "just use our cloud" isn't an acceptable answer — this is what TruSpace is for.

## 🚀 Quick Start

```bash
git clone git@github.com:openkfw/TruSpace.git
cd TruSpace
./start.sh
```

Then open [http://localhost:3000](http://localhost:3000), register a local account, and start creating workspaces. Your data stays on your machine.

> [!TIP]
> Don't want to install anything yet? Play around first in the [online sandbox](https://truspace.dev) — register, log in, and explore public and private workspaces. It's a demo environment, so data may be reset occasionally.

Having trouble? Run `docker ps` and confirm these containers are up: `truspace-frontend`, `truspace-backend`, `ipfs0`, `cluster0`, and the Open Web UI container. Full walkthrough and troubleshooting: [Installation Guide](https://web.truspace.dev/site/getting-started/installation/local/).

### Where to next?

| I want to...                                     | Go here                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Install TruSpace locally                         | [Local Installation Guide](https://web.truspace.dev/site/getting-started/installation/local/) |
| Connect my node to other TruSpace nodes/partners | [Networking Guide](https://web.truspace.dev/site/getting-started/installation/local/)         |
| Understand the architecture in depth             | [Architecture Docs](https://web.truspace.dev/site/architecture/)                              |
| Use TruSpace as an end user                      | [User Guide](https://web.truspace.dev/site/guides/user/)                                      |
| Set up a dev environment / contribute            | [Developer Guide](https://web.truspace.dev/site/guides/developer/)                            |
| Administer a TruSpace node                       | [Admin Guide](https://web.truspace.dev/site/guides/admin/)                                    |

📖 The full documentation lives at **[web.truspace.dev/site](https://web.truspace.dev/site/)** — that's the best place to go deeper on anything below.

## 🧰 Tech Stack

| Layer                 | Technologies                            |
| --------------------- | --------------------------------------- |
| Frontend              | TypeScript · React · Next.js · Radix UI |
| Backend               | TypeScript · Express.js                 |
| Decentralized storage | IPFS · IPFS Cluster                     |
| User database         | SQLite                                  |
| LLM engine            | Ollama                                  |
| AI API & RAG          | Open Web UI                             |
| Containerization      | Docker                                  |

The UI and API (this repository) provide the interface and orchestration layer. When you start TruSpace, it pulls and connects containers for Open Web UI (AI processing) and IPFS/IPFS Cluster (data persistence) — see the [architecture docs](https://web.truspace.dev/site/architecture/) for the full picture, including port mappings and data flow.

## 🌐 How decentralization works

- Each organization runs its own IPFS node — there is no central server holding everyone's documents.
- Nodes automatically replicate documents and metadata (chats, versions, AI perspectives) across the trusted network.
- Pinning is orchestrated via IPFS Cluster to guarantee data availability even if individual nodes go offline.
- Workspaces, documents, and metadata form a hierarchical data model linked via UUIDs; each entry is a single small file, minimizing merge conflicts if the network partitions. See the type definitions in [`backend/src/types/interfaces/truspace.ts`](backend/src/types/interfaces/truspace.ts).

## 🔒 Security & Data Privacy

- Sensitive data (e.g. login credentials) is encrypted at rest in SQLite on the local node.
- Documents sync only to **trusted IPFS peers**; IPFS can be run as a fully private network.
- All inter-node communication is encrypted.
- Documents are encrypted per workspace.

## 🤝 Contributing

Contributions are welcome! Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [Developer Guide](https://web.truspace.dev/site/guides/developer/) for setting up your environment, coding guidelines, and how to submit pull requests.

## 📜 License

Licensed under the **GNU General Public License v3.0** — see [LICENSE](./LICENSE) for details.

## 💬 Community & Support

- 📖 [User Guide](https://web.truspace.dev/site/guides/user/) · [Developer Guide](https://web.truspace.dev/site/guides/developer/) · [Admin Guide](https://web.truspace.dev/site/guides/admin/)
- 💬 [GitHub Discussions](https://github.com/openkfw/TruSpace/discussions)
- 🐛 [Report an issue](https://github.com/openkfw/TruSpace/issues)
- ✍️ Why decentralization and sovereignty matter: [Medium: "Your place or my place?"](https://medium.com/@angryarchitect/your-place-or-my-place-a-tale-of-decentralization-and-sovereignty-c775dafbadbb)

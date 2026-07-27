---
title: Architecture
description: TruSpace system architecture and design
icon: material/sitemap
---

# Architecture

Understanding how TruSpace works under the hood.

<div class="grid cards" markdown>

-   :material-chart-box-outline:{ .lg .middle } **System Overview**

    ---

    High-level architecture and component interaction.

    [:octicons-arrow-right-24: Overview](overview.md)

-   :material-puzzle:{ .lg .middle } **Components**

    ---

    Detailed look at each TruSpace component.

    [:octicons-arrow-right-24: Components](components.md)

-   :material-database:{ .lg .middle } **Data Model**

    ---

    How data is structured and stored.

    [:octicons-arrow-right-24: Data Model](data-model.md)

-   :material-shield-lock:{ .lg .middle } **Security**

    ---

    Security architecture and measures.

    [:octicons-arrow-right-24: Security](security.md)

-   :material-lan:{ .lg .middle } **IPFS Network**

    ---

    Decentralized storage and sync.

    [:octicons-arrow-right-24: IPFS Network](ipfs-network.md)

</div>

## Architecture at a Glance

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
    end
    
    subgraph App["Application Layer"]
        Frontend[Next.js Frontend]
        Backend[Express Backend]
    end
    
    subgraph Storage["Storage Layer"]
        SQLite[(SQLite)]
        IPFS[IPFS Node]
        Cluster[IPFS Cluster]
    end
    
    subgraph AI["AI Layer"]
        Ollama[Ollama]
        WebUI[Open Web UI]
    end
    
    subgraph Network["Network"]
        Peers[Other IPFS Peers]
    end
    
    Browser --> Frontend
    Frontend --> Backend
    Backend --> SQLite
    Backend --> IPFS
    Backend --> Ollama
    IPFS --> Cluster
    Cluster --> Peers
    Ollama --> WebUI
    
    style Frontend fill:#7c3aed,stroke:#333,color:#fff
    style Backend fill:#7c3aed,stroke:#333,color:#fff
    style IPFS fill:#00bcd4,stroke:#333,color:#fff
    style Cluster fill:#00bcd4,stroke:#333,color:#fff
    style Ollama fill:#10b981,stroke:#333,color:#fff
```

## Key Design Principles

### Decentralization

No central server controls data. Each TruSpace node is equal and can operate independently.

### Data Sovereignty

You own and control your data. It stays on infrastructure you control unless you explicitly share it.

### Privacy by Design

AI processing happens locally. Documents are encrypted. Private networks are supported.

### Simplicity

One-command installation. Minimal configuration. Works out of the box.

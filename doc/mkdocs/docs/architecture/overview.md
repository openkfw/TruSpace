---
title: System Overview
description: High-level TruSpace architecture overview
icon: material/chart-box-outline
---

# System Overview

TruSpace is built as a distributed application with multiple cooperating services.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Internet
        User[👤 User Browser]
        OtherNodes[🌐 Other TruSpace Nodes]
    end
    
    subgraph TruSpace["TruSpace Node"]
        subgraph Frontend["Frontend (Port 3000)"]
            NextJS[Next.js App]
            React[React Components]
            UI[Radix UI]
        end
        
        subgraph Backend["Backend (Port 8000)"]
            Express[Express.js]
            Auth[Auth Module]
            API[REST API]
        end
        
        subgraph Storage["Storage"]
            SQLite[(SQLite DB)]
            IPFS[IPFS Node<br/>Port 4001, 5001]
            Cluster[IPFS Cluster<br/>Port 9094-9097]
        end
        
        subgraph AILayer["AI Layer"]
            Ollama[Ollama<br/>Port 11434]
            OpenWebUI[Open Web UI<br/>Port 3333]
        end
    end
    
    User --> NextJS
    NextJS --> Express
    Express --> SQLite
    Express --> IPFS
    Express --> Ollama
    Ollama --> OpenWebUI
    IPFS --> Cluster
    Cluster <--> OtherNodes
    
    style NextJS fill:#7c3aed,stroke:#333,color:#fff
    style Express fill:#7c3aed,stroke:#333,color:#fff
    style IPFS fill:#00bcd4,stroke:#333,color:#fff
    style Cluster fill:#00bcd4,stroke:#333,color:#fff
    style Ollama fill:#10b981,stroke:#333,color:#fff
```

## Service Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 3000 | HTTP | Web interface |
| Backend | 8000 | HTTP | REST API |
| IPFS API | 5001 | HTTP | IPFS operations |
| IPFS Gateway | 8080 | HTTP | Content gateway |
| IPFS Swarm | 4001 | TCP/UDP | Peer connections |
| Cluster API | 9094 | HTTP | Cluster management |
| Cluster Sync | 9096 | TCP | Cluster consensus |
| Open Web UI | 3333 | HTTP | AI interface |
| Ollama | 11434 | HTTP | LLM API |

## Request Flow

### Document Upload

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant I as IPFS
    participant C as Cluster
    participant O as Ollama
    
    U->>F: Upload Document
    F->>B: POST /api/documents
    B->>B: Encrypt Document
    B->>I: Add to IPFS
    I-->>B: CID (Content ID)
    B->>C: Pin Request
    C-->>B: Pinned
    B->>O: Analyze Document
    O-->>B: AI Perspectives
    B->>I: Store Metadata
    B-->>F: Document Created
    F-->>U: Success
```

### Document Retrieval

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant I as IPFS
    
    U->>F: View Document
    F->>B: GET /api/documents/:id
    B->>I: Fetch by CID
    I-->>B: Encrypted Content
    B->>B: Decrypt Document
    B-->>F: Document Data
    F-->>U: Display Document
```

## Data Storage

### What Goes Where

| Data Type | Storage | Encrypted | Synced |
|-----------|---------|-----------|--------|
| User credentials | SQLite | ✓ (bcrypt) | ✗ |
| User profiles | SQLite | ✗ | ✗ |
| Documents | IPFS | ✓ | ✓ |
| Metadata | IPFS | ✗ | ✓ |
| AI perspectives | IPFS | ✗ | ✓ |
| Workspace config | IPFS | ✗ | ✓ |
| AI models | Local disk | ✗ | ✗ |

## Network Topology

### Single Node

```
┌─────────────────────────────────────┐
│            TruSpace Node            │
│  ┌─────────┐  ┌─────────┐          │
│  │Frontend │  │ Backend │          │
│  └────┬────┘  └────┬────┘          │
│       │            │                │
│  ┌────┴────────────┴────┐          │
│  │         IPFS         │          │
│  └──────────────────────┘          │
└─────────────────────────────────────┘
```

### Connected Nodes

```
┌──────────────────┐     ┌──────────────────┐
│   TruSpace A     │     │   TruSpace B     │
│  ┌────────────┐  │     │  ┌────────────┐  │
│  │    IPFS    │◄─┼─────┼─►│    IPFS    │  │
│  └────────────┘  │     │  └────────────┘  │
│  ┌────────────┐  │     │  ┌────────────┐  │
│  │  Cluster   │◄─┼─────┼─►│  Cluster   │  │
│  └────────────┘  │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘
         ▲                        ▲
         │                        │
         └────────────┬───────────┘
                      │
              ┌───────┴───────┐
              │  TruSpace C   │
              │ ┌───────────┐ │
              │ │   IPFS    │ │
              │ └───────────┘ │
              └───────────────┘
```

## Scalability Considerations

### Horizontal Scaling

- Add more TruSpace nodes to the network
- IPFS handles content distribution automatically
- Cluster ensures data availability

### Vertical Scaling

- Increase resources for AI processing
- Add GPUs for faster LLM inference
- Expand storage for larger document sets

### Limitations

| Factor | Practical Limit |
|--------|-----------------|
| Nodes per network | ~50 (soft limit) |
| Documents per workspace | ~10,000 |
| Document size | 100 MB recommended |
| Concurrent users | ~100 per node |

---
title: Components
description: Detailed look at TruSpace components
icon: material/puzzle
---

# Components

TruSpace consists of several interconnected components.

## Frontend

**Technology**: Next.js 14 with React, TypeScript, Radix UI

The frontend provides the user interface for:

- User authentication
- Workspace management  
- Document browsing and upload
- AI chat interface
- System status dashboard

### Key Features

- Server-side rendering for SEO
- Responsive design
- Dark/light mode
- Real-time updates

## Backend

**Technology**: Express.js with TypeScript

The backend API handles:

- User authentication (JWT)
- IPFS operations
- Document encryption/decryption
- AI integration
- Workspace management

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/*` | POST | Authentication |
| `/api/workspaces/*` | CRUD | Workspace management |
| `/api/documents/*` | CRUD | Document operations |
| `/api/ai/*` | POST | AI analysis |
| `/api/health` | GET | Health check |

## IPFS Node

**Technology**: Kubo (go-ipfs)

Handles decentralized content storage:

- Content-addressed storage
- Peer-to-peer file sharing
- Gateway for content access

## IPFS Cluster

**Technology**: ipfs-cluster

Coordinates multi-node pinning:

- Ensures data replication
- Manages pin sets
- Handles consensus

## Ollama

**Technology**: Ollama

Local LLM engine for AI features:

- Model management
- Inference API
- GPU acceleration support

## Open Web UI

**Technology**: Open Web UI

AI chat interface providing:

- Document analysis UI
- RAG capabilities
- Conversation history

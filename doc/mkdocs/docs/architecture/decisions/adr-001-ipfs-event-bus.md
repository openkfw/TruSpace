---
title: "ADR-001: IPFS as Event Bus"
description: Using IPFS as a decentralised event bus for cross-node synchronisation
icon: material/file-document-edit
tags:
  - adr
  - ipfs
  - events
  - sync
---

# ADR-001 — Using IPFS as an Event Bus Between Nodes

| | |
|---|---|
| **Status** | ✅ Accepted |
| **Tags** | `ipfs`, `events`, `sync`, `decentralisation` |

---

## Context

TruSpace consists of multiple independent nodes, each with its own backend and database. There is **no direct API** between node backends, and introducing one is **explicitly not planned** — it would increase installation complexity and expose additional attack surface.

At the same time, certain events must be synchronised across nodes: workspace invitations, permission grants and revocations, workspace deletions. Nodes need a way to exchange a consistent stream of events without any central coordinator.

Traditional approaches are unsuitable:

- **REST / gRPC** — requires direct backend-to-backend communication
- **Centralised message brokers** (Kafka, RabbitMQ) — introduces a central point of failure and dependency

---

## Decision

**IPFS is used as a decentralised event bus.**

Events are written as small files into a protected IPFS directory. This directory is synchronised across all nodes via the IPFS Cluster. Each node polls for newly available event files, reads them, and persists the contained events into its local `EVENTS` table.

Event files serve purely as a **transport and synchronisation mechanism**. All business logic and event handling are executed locally on each node.

A periodic housekeeping job removes processed event files after a defined retention period (typically 1–2 days).

---

## Rationale

- No direct communication channel between node backends exists or is planned
- IPFS enables API-less, decentralised data sync across all participating nodes
- Nodes that go temporarily offline can catch up and replay events once reconnected (eventual consistency)
- The solution avoids central points of failure and aligns with TruSpace's distributed architecture

---

## Consequences

### Positive

- No backend-to-backend API required or exposed
- Decentralised and resilient event distribution
- Temporary persistence of event files enables traceability and replay within a retention window
- Works naturally with the existing IPFS infrastructure

### Negative / Trade-offs

- No real-time guarantees — event processing is eventually consistent
- Additional complexity:
  - Event handling must be **idempotent**
  - Housekeeping and cleanup mechanisms are required
  - Duplicate events must be handled gracefully
- IPFS is not a native message broker — the event model must be explicitly designed for this use

---

## Technical Guidelines

- Each event must have a **globally unique `event_id`** (generated as `nodeId + UUID`)
- Event processing must be **idempotent** — applying the same event twice must produce the same result
- Housekeeping jobs must only remove event files that have been **successfully processed**
- The `EVENTS` table is append-only; processed events are marked, not deleted

---

## Alternatives Considered (and Rejected)

- **Direct backend API communication between nodes** — rejected because exposing additional ports increases installation and operational complexity, and introduces a central dependency

---

## Conclusion

Using IPFS as an event bus is a deliberate architectural decision driven by the constraint of having no direct backend communication between nodes. It provides a pragmatic, decentralised, and resilient approach to synchronising node-level events while fitting naturally into TruSpace's existing infrastructure.

---

## Related

- [:octicons-arrow-right-24: ADR-002 — Email as Global Identifier](adr-002-email-global-id.md)
- [:octicons-arrow-right-24: Workflows — Private Workspace Permissions](../workflows.md)
- [:octicons-arrow-right-24: Data Model — EVENTS table](../data-model.md)

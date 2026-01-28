# Architectural Decision Record: Using IPFS as an Event Bus Between Nodes

## Status

Accepted

## Context

The system consists of multiple independent nodes, each with its own backend and database. There is **no direct API** between the backends of these nodes, and it is **explicitly not planned** to introduce or expose such an API.

At the same time, there is a functional requirement to synchronize certain events across nodes (e.g. workspace invitations, permission revocation), so that all nodes can process a consistent stream of events.

Traditional approaches such as REST, gRPC, or centralized message brokers (e.g. Kafka, RabbitMQ) are not suitable, as they either require direct backend-to-backend communication or introduce central infrastructure and dependencies.

## Decision

**IPFS (InterPlanetary File System)** is used as a decentralized event bus.

Events are written as files into a protected IPFS directory. This directory is synchronized across all nodes. Each node reads newly available event files and persists the contained events into a local `events` table.

The event files are used solely as a transport and synchronization mechanism. All business logic and event handling are performed locally on each node.

A periodic housekeeping job removes processed event files after a defined retention period (e.g. 1–2 days).

## Rationale

- There is no direct communication channel between the backends of different nodes.
- IPFS enables decentralized, API-less data synchronization across all participating nodes.
- Nodes that are temporarily offline can process events retroactively once they reconnect (eventual consistency).
- The solution avoids central points of failure and aligns with the distributed nature of the system.

## Consequences

### Positive Consequences

- No need to introduce or expose backend APIs between nodes.
- Decentralized and resilient event distribution.
- Temporary persistence of event files enables traceability and replay within a limited time window.

### Negative Consequences / Trade-offs

- No real-time guarantees; event processing is eventually consistent.
- Additional complexity due to:
  - Idempotent event handling
  - Housekeeping and cleanup mechanisms
  - Handling of potential duplicate events
- IPFS is not a native message broker; the event model must be explicitly designed to accommodate this.

## Technical Guidelines

- Each event must have a globally unique `event_id`.
- Event processing must be idempotent.
- Housekeeping jobs should only remove event files that have been successfully processed.

## Alternatives Considered (and Rejected)

- Direct backend API communication between nodes (exposing additional ports is not desired and not planned, as it would increase installation and operational complexity)

## Conclusion

Using IPFS as an event bus is a deliberate architectural decision driven by the given constraints. It provides a pragmatic and consistent approach to synchronizing node-level events without direct backend communication.

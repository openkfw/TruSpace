---
title: Architecture Decisions
description: Architecture Decision Records (ADRs) for TruSpace
icon: material/book-open-variant
tags:
  - architecture
  - adr
---

# Architecture Decision Records

Architecture Decision Records (ADRs) document the significant design choices made in TruSpace — the context that led to each decision, the alternatives considered, and the trade-offs accepted.

---

## What is an ADR?

An ADR captures a single architectural decision with:

- **Status** — `Proposed`, `Accepted`, or `Archived`
- **Context** — the problem or constraint that forced a decision
- **Decision** — what was chosen and why
- **Consequences** — the positive and negative outcomes
- **Alternatives** — what was rejected and why

---

## Decision Log

| ID | Title | Status | Tags |
|---|---|---|---|
| [ADR-001](adr-001-ipfs-event-bus.md) | Using IPFS as an Event Bus Between Nodes | ✅ Accepted | `ipfs`, `events`, `sync` |
| [ADR-002](adr-002-email-global-id.md) | Using Email as the Global Identifier in `user_permissions` | ✅ Accepted | `permissions`, `gdpr`, `identity` |

---

## Contributing a New ADR

ADR source files live in `mkdocs/docs/architecture/decisions/` in the repository. To add a new one:

1. Create `mkdocs/docs/architecture/decisions/adr-NNN-short-title.md`
2. Use the template below
3. Open a PR — the ADR will be reviewed and its status updated once accepted
4. Add a row to the table above and a matching page to `mkdocs.yml`

### ADR Template

```markdown
# Architectural Decision Record: <Title>

## Status

Proposed | Accepted | Archived

## Context

<What problem or constraint drove this decision?>

## Decision

<What was decided?>

## Rationale

<Why this option over others?>

## Consequences

### Positive Consequences

- ...

### Negative Consequences / Trade-offs

- ...

## Alternatives Considered (and Rejected)

- <Option>: <Why rejected>

## Conclusion

<Summary sentence>
```

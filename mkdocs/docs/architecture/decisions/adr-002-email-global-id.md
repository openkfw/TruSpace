---
title: "ADR-002: Email as Global User Identifier"
description: Using email address as the global identifier in user_permissions across nodes
icon: material/file-document-edit
tags:
  - adr
  - permissions
  - gdpr
  - identity
---

# ADR-002 — Using Email as the Global Identifier in `user_permissions`

| | |
|---|---|
| **Status** | ✅ Accepted |
| **Tags** | `permissions`, `identity`, `gdpr`, `decentralisation` |

---

## Context

TruSpace manages user permissions across multiple **independent nodes**, each with its own database and its own local user ID sequence.

A single person may therefore have different local user IDs on different nodes:

| Node | Email | Local user ID |
|---|---|---|
| Node A | `test@user.com` | `1` |
| Node B | `test@user.com` | `3` |

For cross-node permission management (e.g. inviting a user on Node B to a private workspace on Node A), the system needs a **stable, globally unique identifier** for each person that works across all nodes without requiring a central registry.

Additionally, because this identifier flows across nodes via IPFS event files, it constitutes **cross-node processing of personal data** — which requires consideration under EU GDPR / DSGVO.

---

## Decision

**The email address is used as the global identifier in the `user_permissions` table**, replacing the local user ID.

- A user with the same verified email on different nodes is treated as the same individual.
- Access rights granted on one node propagate to other nodes via IPFS event files, keyed by email.
- Email verification at registration ensures the person claiming the address is authorised to activate the corresponding permissions.

### GDPR / DSGVO Considerations

Email addresses qualify as **personal data** under EU GDPR/DSGVO (Art. 4(1)) because they can directly or indirectly identify a natural person.

Storing email addresses across multiple nodes constitutes **processing of personal data**, which is permitted under GDPR if:

1. There is a **lawful basis** for processing — user consent at registration, or legitimate interest in operating a collaborative platform
2. Users are **informed** about how their data is processed — via a transparent privacy policy presented at registration
3. **Access controls** are in place to prevent unauthorised exposure of email addresses

Since users must actively verify their email to use the system, this verification step serves as the basis for permission-related use of the address.

!!! warning "Operational requirement"
    Deployments must ensure a valid privacy policy is in place and accessible to users. The legal documents in `frontend/default_terms/` provide a starting template.

---

## Rationale

- Email allows **consistent permission state across nodes** without a centralised user ID system or mapping service
- Email verification guarantees the person actually controls the address before permissions are activated
- The approach is **simple to implement and reason about** — one email = one identity across the entire network
- Avoids the complexity of UUID coordination or cross-node user ID synchronisation

---

## Consequences

### Positive

- Global permission consistency across all connected nodes
- No complex local-ID-to-global-ID mapping layer required
- Simplifies invitation and revocation flows in distributed environments
- Enables offline nodes to catch up on permission events by replaying IPFS event files

### Negative / Trade-offs

- Email addresses are PII — their cross-node propagation triggers GDPR compliance obligations
- Slightly elevated risk in the event of a data breach (email addresses are more sensitive than opaque IDs)
- Email changes require a migration path (not currently implemented — the email is treated as immutable)

---

## Alternatives Considered (and Rejected)

**Local user IDs per node**
: Rejected — local IDs are not stable across nodes. Mapping them would require either a central registry (single point of failure) or a complex reconciliation layer.

**Global random UUID per user**
: Rejected — generating a globally unique UUID for each user requires coordination at account creation time, which reintroduces a centralisation requirement and complicates onboarding.

---

## Conclusion

Using the email address as the global identifier in `user_permissions` is a deliberate design choice that prioritises simplicity and decentralisation. GDPR obligations are acknowledged, and operational compliance measures (privacy policy, access controls, data minimisation) must be applied by each deployment.

---

## Related

- [:octicons-arrow-right-24: ADR-001 — IPFS as Event Bus](adr-001-ipfs-event-bus.md)
- [:octicons-arrow-right-24: Workflows — Private Workspace Permissions](../workflows.md)
- [:octicons-arrow-right-24: Data Model — USER_PERMISSIONS table](../data-model.md)

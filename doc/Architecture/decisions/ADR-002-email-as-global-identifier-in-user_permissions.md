# Architectural Decision Record: Using Email as the Global Identifier in `user_permissions`

## Status

Accepted

## Context

The system needs to manage user permissions across multiple independent nodes. Each node has its own database and assigns local user IDs.

A single individual may have different local user IDs on different nodes. For example:

- `test@user.com` → user ID `1` on Node 1
- `test@user.com` → user ID `3` on Node 2

We want a way to identify users **globally** across nodes for consistent permission management.

Additionally, due to EU privacy regulations (DSGVO / GDPR), storing personally identifiable information (PII) such as email addresses across multiple nodes requires consideration.

## Decision

We will use the **email address** as the global identifier for users in the `user_permissions` table, instead of the local user ID.

- A user with the same verified email on different nodes will be treated as the same individual.
- Access rights and permissions are therefore consistent across nodes.
- Verification of the email ensures that the individual claiming the email is authorized to activate the corresponding permissions.

### GDPR / DSGVO Considerations

- Email addresses are considered **personal data** under EU GDPR/DSGVO because they can contain or identify a natural person (especially if names are included).
- Storing email addresses across multiple nodes constitutes **processing personal data**.
- This is **allowed under GDPR** if:
  1. There is a **lawful basis** for processing (e.g., user consent or legitimate interest).
  2. Users are informed about how their data is processed (transparent privacy policy).
  3. Proper **access controls** are in place to avoid unauthorized exposure.
- Since users must **activate their email** to use the system, this can serve as implicit consent for the purpose of permission management.

## Rationale

- Using the email allows consistent permissions across nodes without requiring a centralized user ID system.
- Email verification ensures the person actually owns the address.
- This approach simplifies distributed permission management while respecting security and privacy requirements.

## Consequences

### Positive Consequences

- Global consistency for user permissions across nodes.
- Avoids complex mappings between local user IDs and global identities.
- Simplifies sharing files and permissions in a decentralized environment.

### Negative Consequences / Trade-offs

- Email addresses are PII, so storing them across nodes triggers GDPR compliance responsibilities.
- Slightly higher risk in case of a data breach (emails are sensitive).

## Alternatives Considered (and Rejected)

- Using local user IDs per node:
  - Rejected because user IDs are local and cannot be mapped across nodes reliably.
  - Would require an additional mapping service or reconciliation layer.
- Generating a global random UUID for each user:
  - Rejected because it complicates onboarding and requires a centralized coordination mechanism.

## Conclusion

Using the email address as a global identifier in `user_permissions` is a deliberate design choice to simplify permission management across nodes. DSGVO/GDPR concerns are acknowledged, and proper operational measures must be applied to ensure compliance.

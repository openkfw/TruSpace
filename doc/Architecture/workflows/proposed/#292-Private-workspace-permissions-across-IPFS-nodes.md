# Proposal: Private workspace permissions across IPFS nodes (#292)

![Status: Proposed](https://img.shields.io/badge/status-proposed-yellow)

---

## **Problem**

Currently, it is not possible for a user on Node X (User A) to create a private workspace and give access to a user on Node Y (User B).  

- The backend stores user management and access rights **locally per node**.
- Adding User B’s email to a private workspace only updates Node X’s database.
- Node Y has no record of this permission, so User B cannot access the workspace.

**Constraints**:

- We should not share user personal data across nodes (DSGVO / privacy compliance).
- Each node should maintain control over its local user database.

---

## **Proposed Solution**

Introduce a **cross-node invitation system**:

1. **Inviting a user from another node**
   - User A on Node X selects the workspace and enters:
     - Email of User B
     - Node address of User B
   - Node X creates an **invite record** with:
     - Workspace ID
     - Invited email
     - Target node
     - Status: `pending`

2. **Invite delivery**
   - Node X sends a **notification** to Node Y containing only:
     - Workspace ID
     - Invitation ID
     - Metadata necessary to accept the invite  
   - No personal data from Node X’s users is included.

3. **Invite acceptance**
   - User B logs in to Node Y and sees pending invitations.
   - Accepting the invite adds the permission **locally** on Node Y:
     - Node Y updates its `user_permissions` table with:
       - workspace_id
       - user_email (local)
       - role
       - status: active
   - Optional: send back a notification to Node X that the invite was accepted (no personal data required).

4. **Invite rejection**
   - User B can decline the invite; the invite record is updated to `rejected`.

---

## **Pros / Cons**

**Pros:**

- Preserves DSGVO compliance: no user data leaves the target node.
- Each node remains responsible for its local users and permissions.
- Invitation system is extendable for notifications, expiration, or revocation.

**Cons / Considerations:**

- Requires a **notification / messaging system** between nodes.
- UI needs a way to manage pending invites and show acceptance/rejection status.
- Optional: syncing acceptance notifications back to origin node.

---

## **Proposed Database Changes**

- Add a new table `workspace_invites`:

```mermaid
erDiagram
    workspace_invites {
        int id PK
        string workspace_id
        string email
        string target_node
        string role
        string status "pending, accepted, rejected"
        datetime created_at
        datetime updated_at
    }

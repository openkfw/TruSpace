---
title: Workspaces
description: Managing workspaces in TruSpace
icon: material/folder-multiple
---

# Workspaces

Workspaces are the primary way to organize content and collaboration.

## Creating a Workspace

1. Click **"Create Workspace"** on the dashboard
2. Enter a name
3. Choose visibility:
   - **Private**: Only invited members
   - **Public**: All users on this node

## Public vs. Private Workspaces

**Public** workspaces are available to all users on this TruSpace node. Any user can create and delete documents and collaborate together.

**Private** workspaces are only available to registered participants. After creation, only the creator has access; other users can be added as participants and then have the same rights to interact with documents in the workspace.

For environments requiring limited access due to e.g. highly sensitive documents, private workspaces are the right choice. For use cases involving many participants where restricted access isn't required — perhaps a testing or evaluation phase — public workspaces can make more sense. It is **crucial** to be aware of your requirements and make an informed decision when choosing between the two.

!!! note "Not visible on the public internet"
    Neither public nor private workspaces are exposed to the internet at large. "Public" only means visible to all users on the same (or a connected) TruSpace node — see [Connecting Nodes](../admin/connecting-nodes.md).

## Managing Members

### Invite Users

1. Open workspace settings
2. Click **"Invite Member"**
3. Enter username/email
4. Select role

### Roles

| Role | Permissions |
|------|-------------|
| Viewer | Read documents |
| Editor | Upload, edit documents |
| Admin | Full control |

## Workspace Settings

- Rename workspace
- Change visibility
- Manage members
- Delete workspace — irreversible; hover over the workspace in the sidebar, open the options menu, and confirm the deletion when prompted

## Related

- [:octicons-arrow-right-24: Documents](documents.md)
- [:octicons-arrow-right-24: Account & Login](account.md)
- [:octicons-arrow-right-24: Use Cases](use-cases.md)
